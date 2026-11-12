import { createFileRoute, redirect } from "@tanstack/react-router";

/** The photos screen moved into the product editor; old links land on its Fotoğraflar tab. */
export const Route = createFileRoute("/admin/_app/products/$productId_/photos")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/admin/products/$productId",
      params: { productId: params.productId },
      search: { tab: "photos" },
      replace: true,
    });
  },
});
