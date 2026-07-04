<?php

namespace App\Http\Middleware;

use App\Services\AdminPermissionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Mirrors server/src/middleware/permission.middleware.js's checkPermission(PERMISSION). */
class CheckAdminPermission
{
    public function __construct(private AdminPermissionService $permissions) {}

    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $admin = $request->user();

        abort_unless($admin, 401);
        abort_unless($this->permissions->hasPermission($admin, $permission), 403, "Forbidden: missing {$permission} permission");

        return $next($request);
    }
}
