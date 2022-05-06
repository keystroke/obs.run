export default async (request, context) => {
  const url = new URL(request.url);
  const parts = url.split("/", 3);
  const flags = new Set(...url.searchParams.keys());

  context.log({ url, parts, flags, params: url.searchParams });

  return await context.next();

  // // Get the page content
  // const response = await context.next();
  // const page = await response.text();

  // // Search for the placeholder
  // const regex = /{{INCLUDE_PRICE_INFO}}/i;

  // // Replace the content
  // const pricingContent = "It's expensive, but buy it anyway.";
  // const updatedPage = page.replace(regex, pricingContent);
  // return new Response(updatedPage, response);
};
