"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { SearchInput } from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function useUpdateParam() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return React.useCallback(
    (key: string, value: string) => {
      const query = new URLSearchParams(searchParams.toString());
      if (value) query.set(key, value);
      else query.delete(key);
      query.delete("page");
      const search = query.toString();
      router.replace(search ? `${pathname}?${search}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname, searchParams],
  );
}

/** Kolom cari yang menyimpan kata kunci di `?q=` (jeda 300 ms). */
function SearchParamInput({
  placeholder,
  name = "q",
  label,
}: {
  placeholder: string;
  name?: string;
  label: string;
}) {
  const searchParams = useSearchParams();
  const update = useUpdateParam();
  const urlValue = searchParams.get(name) ?? "";
  const [prevUrl, setPrevUrl] = React.useState(urlValue);
  const [value, setValue] = React.useState(urlValue);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  if (urlValue !== prevUrl) {
    setPrevUrl(urlValue);
    if (value.trim() !== urlValue) {
      setValue(urlValue);
    }
  }

  React.useEffect(() => {
    clearTimeout(timer.current);
    return () => clearTimeout(timer.current);
  }, [urlValue]);

  return (
    <SearchInput
      aria-label={label}
      placeholder={placeholder}
      value={value}
      onChange={(event) => {
        const next = event.target.value;
        setValue(next);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => update(name, next.trim()), 300);
      }}
    />
  );
}

/** Select filter yang menyimpan pilihan di search param; `defaultValue` (bawaan: opsi pertama) tidak ditulis ke URL. */
function SearchParamSelect({
  name,
  label,
  options,
  defaultValue = options[0]?.value ?? "",
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
}) {
  const searchParams = useSearchParams();
  const update = useUpdateParam();
  const current = searchParams.get(name) ?? defaultValue;
  return (
    <Select
      items={options}
      value={current}
      onValueChange={(value) =>
        update(name, value === defaultValue ? "" : String(value ?? ""))
      }
    >
      <SelectTrigger aria-label={label} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { SearchParamInput, SearchParamSelect };
