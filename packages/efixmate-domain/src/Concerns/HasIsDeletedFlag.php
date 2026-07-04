<?php

namespace Efixmate\Domain\Concerns;

use Illuminate\Database\Eloquent\Builder;

/**
 * Soft-delete-by-flag, mirroring the source schema's `is_deleted BOOLEAN default false`
 * column (every efm_* table uses this convention, not Laravel's native `deleted_at`).
 *
 * Deliberately does not override delete()/restore() — softDelete()/restore() here are
 * separate, explicit methods so existing Eloquent delete() semantics elsewhere are untouched.
 */
trait HasIsDeletedFlag
{
    protected static function bootHasIsDeletedFlag(): void
    {
        static::addGlobalScope('isDeleted', function (Builder $builder) {
            $builder->where($builder->getModel()->getTable() . '.is_deleted', false);
        });
    }

    public function scopeWithTrashed(Builder $query): Builder
    {
        return $query->withoutGlobalScope('isDeleted');
    }

    public function scopeOnlyTrashed(Builder $query): Builder
    {
        return $query->withoutGlobalScope('isDeleted')->where('is_deleted', true);
    }

    public function softDelete(): bool
    {
        return $this->forceFill(['is_deleted' => true])->save();
    }

    public function restore(): bool
    {
        return $this->forceFill(['is_deleted' => false])->save();
    }
}
