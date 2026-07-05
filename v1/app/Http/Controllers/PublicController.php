<?php

namespace App\Http\Controllers;

use Efixmate\Domain\Models\AppConfig;
use Efixmate\Domain\Models\CmsPage;
use Efixmate\Domain\Models\CmsSection;
use Efixmate\Domain\Models\ContactInquiry;
use Efixmate\Domain\Models\SystemSetting;
use Illuminate\Http\Request;

/** Direct port of server/src/modules/public.routes.js (4 endpoints, no auth). */
class PublicController extends Controller
{
    /** POST /api/public/contact-inquiry */
    public function submitContactInquiry(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string'], 'email' => ['required', 'email'], 'phone' => ['nullable', 'string'],
            'subject' => ['nullable', 'string'], 'message' => ['required', 'string'],
        ]);
        $inquiry = ContactInquiry::create(array_merge($data, [
            'status' => 'new', 'source' => 'webapp', 'ip_address' => $request->ip(), 'user_agent' => $request->userAgent(), 'created_at' => now(),
        ]));

        return response()->json(['status' => true, 'message' => 'Thanks for reaching out, we will get back to you soon.', 'data' => ['inquiry_id' => $inquiry->inquiry_id]], 201);
    }

    /** GET /api/public/upload-settings */
    public function uploadSettings()
    {
        $row = SystemSetting::find('upload_settings');

        return response()->json(['status' => true, 'data' => $row?->setting_value ?? [
            'max_file_size_mb' => 5, 'allowed_image_types' => ['jpg', 'jpeg', 'png', 'webp'], 'allowed_video_types' => ['mp4'],
        ]]);
    }

    /** GET /api/public/cms/globals */
    public function cmsGlobals()
    {
        $sections = CmsSection::where('is_global', true)->where('is_active', true)->orderBy('sort_order')->get();

        return response()->json(['status' => true, 'data' => $sections]);
    }

    /** GET /api/public/cms/page/{slug} */
    public function cmsPage(string $slug)
    {
        $page = CmsPage::where('slug', $slug)->where('is_active', true)->where('status', 'published')->first();
        abort_if(! $page, 404, 'Page not found');
        $sections = CmsSection::where('page_id', $page->page_id)->where('is_active', true)->where('status', 'published')->orderBy('sort_order')->get();

        return response()->json(['status' => true, 'data' => ['page' => $page, 'sections' => $sections]]);
    }
}
