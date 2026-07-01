"use client";

import React from "react";
import { useParams, notFound } from "next/navigation";
import PricingCategoryPage from "../pricing/[category]/page";

const VALID_CATEGORIES = ["newborn", "children", "family", "maternity", "fine-art", "nature"];

export default function RootCategoryPricingPage() {
  const params = useParams();
  const category = (params.category as string)?.toLowerCase();

  if (!VALID_CATEGORIES.includes(category)) {
    notFound();
  }

  return <PricingCategoryPage />;
}
