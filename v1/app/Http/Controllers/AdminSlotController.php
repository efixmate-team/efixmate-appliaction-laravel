<?php

namespace App\Http\Controllers;

use Efixmate\Domain\Models\AdminSlotHoliday;
use Efixmate\Domain\Models\MstrTimeSlot;
use Illuminate\Http\Request;

/** Bespoke slot-management endpoints beyond the generic /master/time-slots CRUD. */
class AdminSlotController extends Controller
{
    /** GET /api/admin/slots/holidays */
    public function holidays(Request $request)
    {
        $query = AdminSlotHoliday::query();
        if ($request->filled('area_id')) {
            $query->where('area_id', $request->query('area_id'));
        }

        return response()->json(['status' => true, 'data' => $query->where('is_active', true)->orderBy('holiday_date')->get()]);
    }

    /** POST /api/admin/slots/holidays */
    public function storeHoliday(Request $request)
    {
        $data = $request->validate([
            'area_id' => ['required', 'integer'],
            'holiday_date' => ['required', 'date'],
            'reason' => ['nullable', 'string'],
        ]);
        $holiday = AdminSlotHoliday::create(array_merge($data, ['is_active' => true, 'created_at' => now()]));

        return response()->json(['status' => true, 'message' => 'Holiday added', 'data' => $holiday], 201);
    }

    /** DELETE /api/admin/slots/holidays/{id} */
    public function destroyHoliday(int $id)
    {
        AdminSlotHoliday::where('holiday_id', $id)->update(['is_active' => false, 'is_deleted' => true]);

        return response()->json(['status' => true, 'message' => 'Holiday removed']);
    }

    /** POST /api/admin/slots/{id}/capacity */
    public function updateCapacity(Request $request, int $id)
    {
        $data = $request->validate(['max_capacity' => ['required', 'integer', 'min:0']]);
        $slot = MstrTimeSlot::findOrFail($id);
        $slot->update(['max_capacity' => $data['max_capacity'], 'updated_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Capacity updated', 'data' => $slot->fresh()]);
    }

    /** POST /api/admin/slots/{id}/toggle */
    public function toggle(int $id)
    {
        $slot = MstrTimeSlot::findOrFail($id);
        $slot->update(['is_active' => ! $slot->is_active, 'updated_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Slot toggled', 'data' => $slot->fresh()]);
    }
}
