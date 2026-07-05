<?php

namespace App\Http\Controllers;

use Efixmate\Domain\Models\AdminCmsBanner;
use Efixmate\Domain\Models\CmsPage;
use Efixmate\Domain\Models\CmsSection;
use Efixmate\Domain\Models\CmsSeo;
use Illuminate\Http\Request;

/** Direct port of the CMS cluster in server/.../admin.routes.js: pages, sections, SEO, banners. */
class AdminCmsController extends Controller
{
    /** GET /api/admin/cms/pages */
    public function pages(Request $request)
    {
        $query = CmsPage::query();
        if ($request->filled('page_type')) {
            $query->where('page_type', $request->query('page_type'));
        }

        return response()->json(['status' => true, 'data' => $query->orderBy('display_order')->orderBy('page_id')->get()]);
    }

    /** GET /api/admin/cms/pages/{id} */
    public function showPage(int $id)
    {
        $page = CmsPage::findOrFail($id);
        $sections = CmsSection::where('page_id', $id)->orderBy('sort_order')->get();

        return response()->json(['status' => true, 'data' => ['page' => $page, 'sections' => $sections]]);
    }

    /** POST /api/admin/cms/pages */
    public function storePage(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string'],
            'slug' => ['required', 'string', 'unique:efm_cms_pages,slug'],
            'page_type' => ['nullable', 'string'],
            'content' => ['nullable'],
        ]);

        $page = CmsPage::create(array_merge($data, [
            'status' => 'draft', 'is_active' => true, 'created_by' => 'admin', 'created_at' => now(),
        ]));

        return response()->json(['status' => true, 'message' => 'Page created', 'data' => $page], 201);
    }

    /** PUT /api/admin/cms/pages/{id} */
    public function updatePage(Request $request, int $id)
    {
        $page = CmsPage::findOrFail($id);
        $data = $request->validate([
            'title' => ['sometimes', 'string'],
            'draft_content' => ['sometimes'],
            'meta_title' => ['sometimes', 'nullable', 'string'],
            'meta_description' => ['sometimes', 'nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
        $page->update(array_merge($data, ['updated_by' => 'admin', 'updated_at' => now(), 'last_updated_at' => now()]));

        return response()->json(['status' => true, 'message' => 'Page updated', 'data' => $page->fresh()]);
    }

    /** POST /api/admin/cms/pages/{id}/publish */
    public function publishPage(int $id)
    {
        $page = CmsPage::findOrFail($id);
        $page->update([
            'status' => 'published', 'published_content' => $page->draft_content ?? $page->content,
            'published_at' => now(), 'updated_at' => now(),
        ]);

        return response()->json(['status' => true, 'message' => 'Page published', 'data' => $page->fresh()]);
    }

    /** DELETE /api/admin/cms/pages/{id} */
    public function destroyPage(int $id)
    {
        CmsPage::where('page_id', $id)->update(['is_deleted' => true, 'deleted_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Page deleted']);
    }

    /** POST /api/admin/cms/sections */
    public function storeSection(Request $request)
    {
        $data = $request->validate([
            'page_id' => ['nullable', 'integer'],
            'section_key' => ['required', 'string'],
            'label' => ['nullable', 'string'],
            'section_type' => ['nullable', 'string'],
            'is_global' => ['nullable', 'boolean'],
            'content' => ['nullable'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $section = CmsSection::create(array_merge($data, [
            'status' => 'draft', 'is_active' => true, 'created_by' => 'admin', 'created_at' => now(),
        ]));

        return response()->json(['status' => true, 'message' => 'Section created', 'data' => $section], 201);
    }

    /** PUT /api/admin/cms/sections/{id} */
    public function updateSection(Request $request, int $id)
    {
        $section = CmsSection::findOrFail($id);
        $data = $request->validate([
            'label' => ['sometimes', 'nullable', 'string'],
            'draft_content' => ['sometimes'],
            'sort_order' => ['sometimes', 'integer'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
        $section->update(array_merge($data, ['updated_by' => 'admin', 'updated_at' => now()]));

        return response()->json(['status' => true, 'message' => 'Section updated', 'data' => $section->fresh()]);
    }

    /** POST /api/admin/cms/sections/{id}/publish */
    public function publishSection(int $id)
    {
        $section = CmsSection::findOrFail($id);
        $section->update(['status' => 'published', 'content' => $section->draft_content ?? $section->content, 'published_at' => now(), 'updated_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Section published', 'data' => $section->fresh()]);
    }

    /** DELETE /api/admin/cms/sections/{id} */
    public function destroySection(int $id)
    {
        CmsSection::where('section_id', $id)->update(['is_deleted' => true]);

        return response()->json(['status' => true, 'message' => 'Section deleted']);
    }

    /** GET /api/admin/cms/seo */
    public function seoList(Request $request)
    {
        $query = CmsSeo::query();
        if ($request->filled('entity_type')) {
            $query->where('entity_type', $request->query('entity_type'));
        }

        return response()->json(['status' => true, 'data' => $query->orderByDesc('seo_id')->get()]);
    }

    /** POST /api/admin/cms/seo */
    public function upsertSeo(Request $request)
    {
        $data = $request->validate([
            'entity_type' => ['required', 'string'],
            'entity_id' => ['nullable', 'integer'],
            'slug' => ['required', 'string'],
            'meta_title' => ['nullable', 'string'],
            'meta_description' => ['nullable', 'string'],
        ]);

        $seo = CmsSeo::updateOrCreate(
            ['entity_type' => $data['entity_type'], 'entity_id' => $data['entity_id'] ?? null],
            array_merge($data, ['updated_at' => now()]),
        );

        return response()->json(['status' => true, 'message' => 'SEO saved', 'data' => $seo]);
    }

    /** GET /api/admin/cms/banners */
    public function banners()
    {
        return response()->json(['status' => true, 'data' => AdminCmsBanner::orderBy('sort_order')->orderByDesc('banner_id')->get()]);
    }

    /** POST /api/admin/cms/banners */
    public function storeBanner(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string'],
            'image_url' => ['required', 'string'],
            'link_url' => ['nullable', 'string'],
            'placement' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer'],
        ]);
        $banner = AdminCmsBanner::create(array_merge($data, ['is_active' => true, 'created_at' => now()]));

        return response()->json(['status' => true, 'message' => 'Banner created', 'data' => $banner], 201);
    }

    /** PUT /api/admin/cms/banners/{id} */
    public function updateBanner(Request $request, int $id)
    {
        $banner = AdminCmsBanner::findOrFail($id);
        $banner->update(array_merge($request->all(), ['updated_at' => now()]));

        return response()->json(['status' => true, 'message' => 'Banner updated', 'data' => $banner->fresh()]);
    }

    /** DELETE /api/admin/cms/banners/{id} */
    public function destroyBanner(int $id)
    {
        AdminCmsBanner::where('banner_id', $id)->update(['is_deleted' => true, 'deleted_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Banner deleted']);
    }
}
