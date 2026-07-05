<?php

namespace App\Http\Controllers;

use App\Services\FileUploadService;
use App\Support\GeoAreaResolver;
use Efixmate\Domain\Models\CustomerAddress;
use Efixmate\Domain\Support\UploadSlots;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Direct port of profile/address handlers in server/src/modules/user/controller/user.controller.js
 * (profile, updateProfile, updateAddress, getAddresses, activateAddress, deleteAddress).
 */
class ProfileController extends Controller
{
    public function __construct(private FileUploadService $uploads) {}

    /** GET /api/user/profile */
    public function profile(Request $request)
    {
        $customer = $request->user();

        $address = CustomerAddress::where('customer_id', $customer->customer_id)
            ->where('is_active', true)
            ->orderByDesc('address_id')
            ->first();

        $data = $customer->toArray();
        $data['address'] = $address;

        return response()->json(['status' => true, 'data' => $data]);
    }

    /** POST /api/user/update-profile */
    public function updateProfile(Request $request)
    {
        $customer = $request->user();

        $data = $request->validate([
            'firstName' => ['nullable', 'string', 'max:100'],
            'first_name' => ['nullable', 'string', 'max:100'],
            'lastName' => ['nullable', 'string', 'max:100'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'string', 'max:150'],
            'profile_pitcher' => ['nullable', 'string'],
            'profilePitcher' => ['nullable', 'string'],
        ]);

        $profilePitcher = $customer->profile_pitcher;
        if ($request->hasFile('profile_pitcher')) {
            $profilePitcher = $this->uploads->store($request->file('profile_pitcher'), UploadSlots::USER_PROFILE, $customer->customer_id, true);
        } elseif (! empty($data['profile_pitcher'])) {
            $profilePitcher = $data['profile_pitcher'];
        } elseif (! empty($data['profilePitcher'])) {
            $profilePitcher = $data['profilePitcher'];
        }

        $customer->update([
            'first_name' => $data['firstName'] ?? $data['first_name'] ?? $customer->first_name,
            'last_name' => $data['lastName'] ?? $data['last_name'] ?? $customer->last_name,
            'email' => $data['email'] ?? $customer->email,
            'profile_pitcher' => $profilePitcher,
            'updated_by' => 'user',
            'updated_at' => now(),
        ]);

        return response()->json(['status' => true, 'message' => 'Profile updated successfully', 'data' => $customer]);
    }

    /** POST /api/user/address — upsert-by-id, matches Node's updateAddress exactly. */
    public function updateAddress(Request $request)
    {
        $customerId = $request->user()->customer_id;

        $data = $request->validate([
            'addressId' => ['nullable', 'integer'],
            'address_id' => ['nullable', 'integer'],
            'address' => ['required', 'string'],
            'city' => ['required', 'string'],
            'state' => ['required', 'string'],
            'country' => ['required', 'string'],
            'pincode' => ['required'],
            'latitude' => ['required'],
            'longitude' => ['required'],
            'selected' => ['nullable', 'boolean'],
            'is_selected' => ['nullable', 'boolean'],
            'address_type' => ['nullable', 'string'],
            'house_no' => ['nullable', 'string'],
            'landmark' => ['nullable', 'string'],
            'contact_name' => ['nullable', 'string'],
            'contact_phone' => ['nullable', 'string'],
        ]);

        $addressId = $data['addressId'] ?? $data['address_id'] ?? null;
        $isSelected = $data['selected'] ?? $data['is_selected'] ?? null;
        $areaId = GeoAreaResolver::resolveAreaIdFromCoordinates((float) $data['latitude'], (float) $data['longitude']);

        $extra = [
            'address_type' => $data['address_type'] ?? 'home',
            'house_no' => $data['house_no'] ?? null,
            'landmark' => $data['landmark'] ?? null,
            'contact_name' => $data['contact_name'] ?? null,
            'contact_phone' => $data['contact_phone'] ?? null,
        ];

        if ($addressId) {
            $existing = CustomerAddress::where('address_id', $addressId)->first();
            abort_if(! $existing || (int) $existing->customer_id !== (int) $customerId, 404, 'Address not found');
            abort_if($existing->is_active === false, 410, 'Address has been removed');

            if ($isSelected) {
                CustomerAddress::where('customer_id', $customerId)->update(['is_selected' => false]);
            }

            $existing->update(array_merge([
                'address' => $data['address'],
                'city' => $data['city'],
                'state' => $data['state'],
                'country' => $data['country'],
                'pincode' => $data['pincode'],
                'latitude' => $data['latitude'],
                'longitude' => $data['longitude'],
                'is_selected' => $isSelected ?? $existing->is_selected,
                'updated_by' => 'user',
                'updated_at' => now(),
                'area_id' => $areaId,
            ], $extra));

            $row = $existing->fresh();
        } else {
            if ($isSelected) {
                CustomerAddress::where('customer_id', $customerId)->update(['is_selected' => false]);
            }

            $row = CustomerAddress::create(array_merge([
                'customer_id' => $customerId,
                'address' => $data['address'],
                'city' => $data['city'],
                'state' => $data['state'],
                'country' => $data['country'],
                'pincode' => $data['pincode'],
                'latitude' => $data['latitude'],
                'longitude' => $data['longitude'],
                'is_active' => true,
                'is_selected' => (bool) $isSelected,
                'created_by' => 'user',
                'created_at' => now(),
                'area_id' => $areaId,
            ], $extra));
        }

        return response()->json(['status' => true, 'message' => 'Address updated/created successfully', 'data' => $row]);
    }

    /** GET /api/user/address */
    public function getAddresses(Request $request)
    {
        $addresses = CustomerAddress::where('customer_id', $request->user()->customer_id)
            ->where(function ($q) {
                $q->where('is_active', true)->orWhereNull('is_active');
            })
            ->orderByDesc('is_selected')
            ->orderByDesc('address_id')
            ->get();

        return response()->json(['status' => true, 'data' => $addresses]);
    }

    /** POST /api/user/activate-address */
    public function activateAddress(Request $request)
    {
        $data = $request->validate(['addressId' => ['required', 'integer']]);
        $customerId = $request->user()->customer_id;

        $row = DB::transaction(function () use ($data, $customerId) {
            CustomerAddress::where('customer_id', $customerId)->update(['is_selected' => false]);

            $affected = CustomerAddress::where('address_id', $data['addressId'])
                ->where('customer_id', $customerId)
                ->update(['is_selected' => true]);

            abort_if($affected === 0, 404, 'Address not found');

            return CustomerAddress::find($data['addressId']);
        });

        return response()->json(['status' => true, 'message' => 'Address activated', 'data' => $row]);
    }

    /** POST /api/user/delete-address and POST /api/user/address/delete (alias) */
    public function deleteAddress(Request $request)
    {
        $addressId = (int) ($request->input('addressId') ?? $request->input('address_id'));
        abort_if(! $addressId, 400, 'addressId is required');

        $customerId = $request->user()->customer_id;

        $existing = CustomerAddress::where('address_id', $addressId)
            ->where('customer_id', $customerId)
            ->first();
        abort_if(! $existing, 404, 'Address not found');

        if ($existing->is_active !== false) {
            $wasSelected = (bool) $existing->is_selected;
            $existing->update(['is_active' => false, 'is_selected' => false]);

            if ($wasSelected) {
                $next = CustomerAddress::where('customer_id', $customerId)
                    ->where('is_active', true)
                    ->orderByDesc('address_id')
                    ->first();
                $next?->update(['is_selected' => true]);
            }
        }

        $remaining = CustomerAddress::where('customer_id', $customerId)
            ->where('is_active', true)
            ->orderByDesc('is_selected')
            ->orderByDesc('address_id')
            ->get();

        $selectedAddress = $remaining->firstWhere('is_selected', true) ?? $remaining->first();

        return response()->json(['status' => true, 'message' => 'Address deleted', 'data' => ['selectedAddress' => $selectedAddress]]);
    }
}
