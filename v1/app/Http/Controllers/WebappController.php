<?php

namespace App\Http\Controllers;

use App\Support\PublicUrlResolver;
use Efixmate\Domain\Models\MstrService;
use Efixmate\Domain\Models\MstrServiceCategory;
use Efixmate\Domain\Models\WebappQuickGrid;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Direct port of server/src/modules/webapp.routes.js — no-auth public SEO/catalog surface (7 endpoints). */
class WebappController extends Controller
{
    /** GET /api/webapp/catalog */
    public function catalog(Request $request)
    {
        $categories = MstrServiceCategory::where('is_active', true)->orderBy('order_seq')->get();
        $services = MstrService::where('is_active', true)->orderBy('category_id')->orderBy('order_seq')->get();

        return response()->json(['status' => true, 'data' => [
            'categories' => $categories->map(fn ($c) => [
                'category_id' => $c->category_id, 'category_name' => $c->category_name,
                'category_icon' => PublicUrlResolver::resolve($request, $c->category_icon), 'category_color' => $c->category_color,
            ]),
            'services' => $services->map(fn ($s) => [
                'service_id' => $s->service_id, 'category_id' => $s->category_id, 'title' => $s->service,
                'slug' => $s->slug, 'price' => $s->base_price, 'image' => PublicUrlResolver::resolve($request, $s->image_url ?? $s->service_icon),
            ]),
        ]]);
    }

    /** GET /api/webapp/popular-services */
    public function popularServices()
    {
        $rows = DB::table('efm_mstr_services as s')
            ->leftJoinSub(DB::table('efm_booking_lines')->select('service_id', DB::raw('COUNT(*) as booking_count'))->groupBy('service_id'), 'bc', 's.service_id', '=', 'bc.service_id')
            ->where('s.is_active', true)->orderByDesc(DB::raw('COALESCE(bc.booking_count,0)'))->orderBy('s.service_id')
            ->select('s.service_id', 's.service as title', 's.slug', 's.base_price', 's.image_url', 's.service_icon')
            ->limit(10)->get();

        return response()->json(['status' => true, 'data' => $rows]);
    }

    /** GET /api/webapp/quick-grids */
    public function quickGrids()
    {
        return response()->json(['status' => true, 'data' => WebappQuickGrid::where('is_active', true)->orderBy('sort_order')->get()]);
    }

    /** GET /api/webapp/emergency-services */
    public function emergencyServices()
    {
        $rows = MstrService::where('is_active', true)->where('is_emergency', true)->orderBy('service_id')->limit(10)->get();

        return response()->json(['status' => true, 'data' => $rows]);
    }

    /** GET /api/webapp/search */
    public function search(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        if ($q === '') {
            return response()->json(['status' => true, 'data' => ['categories' => [], 'services' => []]]);
        }

        $categories = MstrServiceCategory::where('is_active', true)->where('category_name', 'like', "%{$q}%")->limit(5)->get(['category_id', 'category_name']);
        $services = MstrService::where('is_active', true)->where('service', 'like', "%{$q}%")->limit(10)->get(['service_id', 'service', 'slug', 'base_price']);

        return response()->json(['status' => true, 'data' => ['categories' => $categories, 'services' => $services]]);
    }

    /** GET /api/webapp/search-services */
    public function searchServices(Request $request)
    {
        return $this->search($request);
    }

    /** GET /api/webapp/sitemap-data */
    public function sitemapData()
    {
        $services = MstrService::where('is_active', true)->get(['service_id', 'slug', 'updated_at']);
        $categories = MstrServiceCategory::where('is_active', true)->get(['category_id', 'category_name', 'updated_at']);

        return response()->json(['status' => true, 'data' => [
            'services' => $services->map(fn ($s) => ['slug' => $s->slug, 'updated_at' => $s->updated_at]),
            'categories' => $categories->map(fn ($c) => ['category_id' => $c->category_id, 'updated_at' => $c->updated_at]),
        ]]);
    }
}
