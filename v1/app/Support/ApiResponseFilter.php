<?php

namespace App\Support;

/**
 * Direct port of server/src/utils/response.js's filterResponse(). Strips internal
 * UID/secret fields and aliases whatever the row's actual primary key is onto a
 * normalized `id` field — used throughout the Node app's JSON responses, so ported
 * here for exact response-shape parity rather than just endpoint-existence parity.
 */
class ApiResponseFilter
{
    private const HIDDEN_FIELDS = ['admin_uid', 'customer_uid', 'booking_uid', 'password', 'secret_key'];

    private const PK_FIELDS = [
        'admin_id', 'customer_id', 'booking_id',
        'service_id', 'category_id', 'coupon_id', 'discount_id', 'pricing_id',
        'city_id', 'state_id', 'country_id', 'currency_id', 'language_id', 'timezone_id',
        'status_id', 'status_type_id', 'slot_id',
    ];

    public static function filter(mixed $data): mixed
    {
        if ($data === null) return $data;

        if (is_array($data) && array_is_list($data)) {
            return array_map(fn ($row) => self::filterRow($row), $data);
        }

        return self::filterRow($data);
    }

    private static function filterRow(mixed $row): mixed
    {
        if (is_object($row)) {
            $row = (array) $row;
            $filtered = self::filterRow($row);

            return (object) $filtered;
        }

        if (! is_array($row)) return $row;

        foreach (self::HIDDEN_FIELDS as $field) {
            unset($row[$field]);
        }

        if (! array_key_exists('id', $row)) {
            foreach (self::PK_FIELDS as $pk) {
                if (array_key_exists($pk, $row)) {
                    $row['id'] = $row[$pk];
                    break;
                }
            }
        }

        return $row;
    }
}
