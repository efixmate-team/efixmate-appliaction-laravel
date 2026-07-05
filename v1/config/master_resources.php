<?php

/**
 * Direct port of server/src/modules/masters/controller/master.controller.js's
 * `masterTables` config object. Same 25 resource slugs, same tables, same
 * insertFields per resource — kept 1:1 so the two are diffable against each other.
 *
 * audit_on_insert / audit_on_update mirror the Node TABLES_REQUIRING_AUDIT_ON_INSERT
 * set and the two-tier applyAuditColumnsForUpdate() sets ('full' = updated_by +
 * updated_at, 'timestamp_only' = updated_at only, null = neither).
 */

return [
    // ── Geography ──
    'countries' => [
        'table' => 'efm_mstr_countries',
        'id_col' => 'country_id',
        'insert_fields' => ['country_name', 'country_code', 'dial_code', 'currency_id', 'timezone_ids', 'language_ids', 'is_active'],
        'search_col' => 'country_name',
        'audit_on_insert' => false,
        'audit_on_update' => 'timestamp_only',
    ],
    'states' => [
        'table' => 'efm_mstr_states',
        'id_col' => 'state_id',
        'insert_fields' => ['country_id', 'state_name', 'state_code', 'is_active'],
        'search_col' => 'state_name',
        'audit_on_insert' => false,
        'audit_on_update' => 'timestamp_only',
    ],
    'cities' => [
        'table' => 'efm_mstr_cities',
        'id_col' => 'city_id',
        'insert_fields' => ['state_id', 'city_name', 'is_active'],
        'search_col' => 'city_name',
        'audit_on_insert' => false,
        'audit_on_update' => 'timestamp_only',
    ],
    'areas' => [
        'table' => 'efm_mstr_areas',
        'id_col' => 'area_id',
        'insert_fields' => ['city_id', 'area_type_id', 'area_name', 'latitude', 'longitude', 'radius_km', 'polygon_coordinates', 'max_active_bookings', 'is_active'],
        'search_col' => 'area_name',
        'audit_on_insert' => true,
        'audit_on_update' => 'full',
    ],

    // ── Finance ──
    // 'commissions' alias -> efm_mstr_commission_rules, same as 'commission-rules' (legacy alias, kept for parity)
    'commissions' => [
        'table' => 'efm_mstr_commission_rules',
        'id_col' => 'rule_id',
        'insert_fields' => ['rule_name', 'commission_mode', 'commission_value', 'is_active'],
        'search_col' => 'rule_name',
        'audit_on_insert' => false,
        'audit_on_update' => 'timestamp_only',
    ],
    'commission-rules' => [
        'table' => 'efm_mstr_commission_rules',
        'id_col' => 'rule_id',
        'insert_fields' => [
            'rule_name', 'rule_type', 'commission_mode', 'commission_value',
            'min_commission', 'max_commission', 'service_id', 'area_id', 'city_id',
            'technician_id', 'campaign_code', 'applies_to_surge', 'surge_rate_addon',
            'formula', 'stack_group', 'priority', 'valid_from', 'valid_until',
            'gst_applicable', 'gst_rate', 'tds_applicable', 'tds_section', 'tds_rate', 'is_active',
        ],
        'search_col' => 'rule_name',
        'audit_on_insert' => false,
        'audit_on_update' => 'timestamp_only',
    ],
    'discounts' => [
        'table' => 'efm_mstr_discounts',
        'id_col' => 'discount_id',
        'insert_fields' => ['discount_title', 'discount_type', 'discount_value', 'is_active'],
        'search_col' => 'discount_title',
        'audit_on_insert' => false,
        'audit_on_update' => null,
    ],
    'taxes' => [
        'table' => 'efm_mstr_taxes',
        'id_col' => 'tax_id',
        'insert_fields' => ['tax_name', 'tax_percentage', 'is_active'],
        'search_col' => 'tax_name',
        'audit_on_insert' => false,
        'audit_on_update' => null,
    ],
    'charges' => [
        'table' => 'efm_mstr_charges',
        'id_col' => 'charge_id',
        'insert_fields' => ['charge_name', 'charge_type', 'charge_value', 'is_active'],
        'search_col' => 'charge_name',
        'audit_on_insert' => false,
        'audit_on_update' => null,
    ],
    'coupons' => [
        'table' => 'efm_mstr_coupons',
        'id_col' => 'coupon_id',
        'insert_fields' => [
            'coupon_code', 'coupon_type', 'discount_type', 'discount_value',
            'min_order_amount', 'max_discount_amount', 'buy_x', 'get_y',
            'usage_type', 'usage_limit', 'valid_from', 'valid_until', 'is_active',
        ],
        'search_col' => 'coupon_code',
        'audit_on_insert' => false,
        'audit_on_update' => null,
    ],

    // ── Services ──
    'service-categories' => [
        'table' => 'efm_mstr_service_category',
        'id_col' => 'category_id',
        'insert_fields' => ['category_name', 'category_icon', 'category_color', 'description', 'order_seq', 'is_active'],
        'search_col' => 'category_name',
        'audit_on_insert' => true,
        'audit_on_update' => 'full',
    ],
    'services' => [
        'table' => 'efm_mstr_services',
        'id_col' => 'service_id',
        'insert_fields' => ['category_id', 'service', 'description', 'base_price', 'duration', 'image_url', 'service_icon', 'service_color', 'order_seq', 'booking_type_ids', 'unit_ids', 'charge_ids', 'is_active'],
        'search_col' => 'service',
        'audit_on_insert' => true,
        'audit_on_update' => 'full',
    ],
    'service-pricing' => [
        'table' => 'efm_service_pricing',
        'id_col' => 'pricing_id',
        'insert_fields' => ['service_id', 'booking_type_id', 'city_id', 'price', 'unit_price', 'is_active'],
        'search_col' => null,
        'audit_on_insert' => false,
        'audit_on_update' => null,
    ],
    'time-slots' => [
        'table' => 'efm_mstr_time_slots',
        'id_col' => 'slot_id',
        'insert_fields' => ['area_id', 'service_id', 'name', 'start_time', 'end_time', 'surge_multiplier', 'max_capacity', 'is_instant', 'is_active'],
        'search_col' => null,
        'audit_on_insert' => false,
        'audit_on_update' => null,
    ],

    // ── Users & Bookings ──
    'users' => [
        'table' => 'efm_customers',
        'id_col' => 'customer_id',
        'insert_fields' => ['first_name', 'last_name', 'mobile_number', 'email', 'is_active'],
        'search_col' => 'first_name',
        'audit_on_insert' => true,
        'audit_on_update' => null,
    ],
    'technicians' => [
        'table' => 'efm_technicians',
        'id_col' => 'technician_id',
        'insert_fields' => ['first_name', 'last_name', 'mobile_number', 'email', 'current_jobs', 'max_jobs', 'is_active'],
        'search_col' => 'first_name',
        'audit_on_insert' => true,
        'audit_on_update' => null,
    ],
    'feedbacks' => [
        'table' => 'efm_feedbacks',
        'id_col' => 'feedback_id',
        'insert_fields' => ['user_id', 'rating', 'comment', 'status', 'is_active'],
        'search_col' => 'comment',
        'audit_on_insert' => false,
        'audit_on_update' => null,
    ],
    'bookings' => [
        'table' => 'efm_bookings',
        'id_col' => 'booking_id',
        'insert_fields' => [
            'customer_id', 'address_id', 'service_category_id', 'service_id',
            'area_id', 'slot_id', 'technician_id', 'booking_type_id',
            'quantity', 'base_price', 'unit_price', 'inspection_fee',
            'estimated_price', 'final_price', 'booking_status_id',
            'payment_status_id', 'payment_mode_id', 'problem_description',
            'scheduled_date', 'scheduled_time', 'is_active',
        ],
        'search_col' => 'problem_description',
        'audit_on_insert' => false,
        'audit_on_update' => null,
    ],
    'promotions' => [
        'table' => 'efm_promotions',
        'id_col' => 'announcement_id',
        'insert_fields' => [
            'title', 'subtitle', 'message', 'description',
            'announcement_type', 'trigger_type',
            'scope_type', 'scope_ids',
            'desktop_image_url', 'mobile_image_url', 'background_color',
            'cta_text', 'cta_action_type', 'cta_value',
            'coupon_code', 'discount_type', 'discount_value', 'min_order_amount', 'max_discount',
            'usage_limit', 'per_user_limit',
            'timezone', 'start_at', 'end_at',
            'priority', 'is_active', 'is_scheduled', 'is_disabled',
        ],
        'search_col' => 'title',
        'audit_on_insert' => true,
        'audit_on_update' => 'full',
    ],
    'referrals' => [
        'table' => 'efm_referrals',
        'id_col' => 'referral_id',
        'insert_fields' => ['referrer_id', 'referred_id', 'status', 'is_active'],
        'search_col' => 'status',
        'audit_on_insert' => false,
        'audit_on_update' => null,
        'default_order_desc' => true,
    ],

    // ── Transactions ──
    'payments' => [
        'table' => 'efm_payment_orders',
        'id_col' => 'order_id',
        'insert_fields' => ['customer_id', 'booking_id', 'amount', 'currency', 'payment_type', 'booking_type_id', 'gateway_order_id', 'payment_status_id', 'is_active'],
        'search_col' => 'currency',
        'audit_on_insert' => false,
        'audit_on_update' => null,
    ],
    'invoices' => [
        'table' => 'efm_invoices',
        'id_col' => 'invoice_id',
        'insert_fields' => ['booking_id', 'invoice_number', 'amount', 'status', 'is_active'],
        'search_col' => 'invoice_number',
        'audit_on_insert' => false,
        'audit_on_update' => null,
    ],
    'refunds' => [
        'table' => 'efm_refunds',
        'id_col' => 'refund_id',
        'insert_fields' => ['payment_id', 'gateway_refund_id', 'amount', 'reason', 'refund_status_id'],
        'search_col' => null,
        'audit_on_insert' => false,
        'audit_on_update' => null,
    ],
    'payouts' => [
        'table' => 'efm_payouts',
        'id_col' => 'payout_id',
        'insert_fields' => ['technician_id', 'amount', 'payout_method', 'status'],
        'search_col' => null,
        'audit_on_insert' => false,
        'audit_on_update' => null,
    ],
    'transaction-taxes' => [
        'table' => 'efm_transaction_taxes',
        'id_col' => 'tax_log_id',
        'insert_fields' => ['transaction_id', 'tax_amount', 'tax_type', 'is_active'],
        'search_col' => null,
        'audit_on_insert' => false,
        'audit_on_update' => null,
    ],
    'skills' => [
        'table' => 'efm_mstr_skills',
        'id_col' => 'skill_id',
        'insert_fields' => ['skill_name', 'category_id', 'description', 'skill_icon', 'skill_color', 'order_seq', 'is_active'],
        'search_col' => 'skill_name',
        'audit_on_insert' => true,
        'audit_on_update' => 'full',
    ],
];
