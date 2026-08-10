"use client";

import { useEffect, useState } from "react";

export function LocalTime({
  dateTime,
}: {
  dateTime: string;
}) {
  const [formatted, setFormatted] = useState<string>("");

  useEffect(() => {
    setFormatted(new Date(dateTime).toLocaleString());
  }, [dateTime]);

  return (
    <time dateTime={dateTime}>
      {formatted || "—"}
    </time>
  );
}