'use client';

import { useState, useEffect, useMemo, useRef } from "react";
import { masterAPI, lookupAPI } from "@/lib/api";
import Select from "./Select";

const EMPTY_FILTERS = Object.freeze({});

function stableStringify(value) {
  if (!value || typeof value !== "object") return "";

  return JSON.stringify(
    Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = value[key];
        return acc;
      }, {})
  );
}

export default function AsyncSelect({
  resource,
  filters = EMPTY_FILTERS,
  labelKey = "name",
  valueKey = "id",
  apiType = "master",
  onLoad,
  ...props
}) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const onLoadRef = useRef(onLoad);
  const filtersKey = useMemo(() => stableStringify(filters), [filters]);
  const stableFilters = useMemo(
    () => (filtersKey ? JSON.parse(filtersKey) : EMPTY_FILTERS),
    [filtersKey]
  );

  useEffect(() => {
    onLoadRef.current = onLoad;
  }, [onLoad]);

  useEffect(() => {
    if (!resource) return;

    let mounted = true;

    const fetchOptions = async () => {
      try {
        setLoading(true);

        const api = apiType === "lookup" ? lookupAPI : masterAPI;

        const res = await api.getLookups(resource, stableFilters);

        if (!mounted) return;

        if (res.status && res.data) {
          const formatted = res.data.map((item) => {
            let singular = resource;

            if (resource.endsWith("ies")) {
              singular = resource.substring(0, resource.length - 3) + "y";
            } else if (resource.endsWith("s")) {
              singular = resource.substring(0, resource.length - 1);
            }

            const rawId =
              item[`${singular}_id`] ||
              item.id ||
              item[valueKey];

            return {
              id:
                rawId !== undefined && rawId !== null
                  ? String(rawId)
                  : undefined,

              label:
                item[labelKey] ||
                item[`${singular}_name`] ||
                item.name ||
                item.title ||
                item.status ||
                "Unnamed",
            };
          });

          const unique = [];
          const seen = new Set();

          for (const item of formatted) {
            const key = item.id;

            if (key && !seen.has(key)) {
              seen.add(key);
              unique.push(item);
            }
          }

          setOptions(unique);

          if (onLoadRef.current) {
            onLoadRef.current(unique);
          }
        }
      } catch (error) {
        console.error(`[AsyncSelect Error] ${resource}:`, error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchOptions();

    return () => {
      mounted = false;
    };
  }, [resource, apiType, labelKey, valueKey, stableFilters]);

  return (
    <Select
      {...props}
      options={options}
      disabled={props.disabled || loading}
      placeholder={loading ? "Loading..." : props.placeholder}
    />
  );
}
