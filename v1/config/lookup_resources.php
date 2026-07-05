<?php

/**
 * Direct port of server/src/modules/masters/controller/lookup.controller.js's
 * `lookupTables` config object. Same 8 resource slugs.
 *
 * audit_required mirrors Node's TABLES_REQUIRING_AUDIT_ON_INSERT set (lookup.controller.js
 * only ever adds created_by/created_at, never touches updated_by/updated_at on update).
 */

return [
    'document-types' => [
        'table' => 'efm_lkp_document_type',
        'id_col' => 'document_type_id',
        'insert_fields' => ['document_type', 'applies_to', 'order_seq', 'is_mandatory', 'is_active'],
        'audit_required' => true,
    ],
    'booking-types' => [
        'table' => 'efm_lkp_booking_type',
        'id_col' => 'booking_type_id',
        'insert_fields' => ['booking_type', 'description', 'order_seq', 'is_active'],
        'audit_required' => true,
        'name_field' => 'booking_type',
    ],
    'payment-modes' => [
        'table' => 'efm_lkp_payment_modes',
        'id_col' => 'payment_mode_id',
        'insert_fields' => ['payment_mode', 'description', 'order_seq', 'is_active'],
        'audit_required' => true,
        'name_field' => 'payment_mode',
    ],
    'currencies' => [
        'table' => 'efm_lkp_currencies',
        'id_col' => 'currency_id',
        'insert_fields' => ['currency_name', 'currency_code', 'currency_symbol', 'is_active'],
        'audit_required' => false,
    ],
    'languages' => [
        'table' => 'efm_lkp_languages',
        'id_col' => 'language_id',
        'insert_fields' => ['language_name', 'language_code', 'is_active'],
        'audit_required' => false,
    ],
    'timezones' => [
        'table' => 'efm_lkp_timezones',
        'id_col' => 'timezone_id',
        'insert_fields' => ['timezone_name', 'utc_offset', 'is_active'],
        'audit_required' => false,
    ],
    'units' => [
        'table' => 'efm_lkp_units',
        'id_col' => 'unit_id',
        'insert_fields' => ['unit_name', 'unit_symbol', 'is_active'],
        'audit_required' => false,
    ],
    'area-types' => [
        'table' => 'efm_lkp_area_type',
        'id_col' => 'area_type_id',
        'insert_fields' => ['area_type', 'description', 'order_seq', 'is_active'],
        'audit_required' => false,
    ],
];
