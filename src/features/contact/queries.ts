import { queryOptions, useMutation } from "@tanstack/react-query";
import { storeApi } from "@/lib/api/clients";
import type { components } from "../../../api/specs/openapi-store";

export type ContactCategory = components["schemas"]["ContactCategoryOut"];

export const contactCategoriesQuery = () =>
  queryOptions({
    queryKey: ["contact", "categories"],
    queryFn: async () =>
      ((await storeApi.GET("/api/store/contact/categories")).data ?? []) as ContactCategory[],
  });

export type ContactBody = {
  categoryId: number;
  name: string;
  email: string;
  orderNumber: string;
  message: string;
  /** The hidden honeypot field. Real Shoppers leave it empty. */
  website: string;
};

export const useSubmitContact = () =>
  useMutation({
    mutationFn: async (b: ContactBody) => {
      await storeApi.POST("/api/store/contact", {
        body: {
          category_id: b.categoryId,
          name: b.name.trim(),
          email: b.email.trim(),
          order_number: b.orderNumber.trim(),
          message: b.message.trim(),
          website: b.website,
        },
      });
    },
  });
