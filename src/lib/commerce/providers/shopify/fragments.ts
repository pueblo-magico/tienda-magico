export const moneyFragment = /* GraphQL */ `
  fragment Money on MoneyV2 {
    amount
    currencyCode
  }
`;

export const imageFragment = /* GraphQL */ `
  fragment Image on Image {
    url
    altText
    width
    height
  }
`;

export const productVariantFragment = /* GraphQL */ `
  fragment ProductVariant on ProductVariant {
    id
    title
    availableForSale
    quantityAvailable
    sku
    selectedOptions {
      name
      value
    }
    price {
      ...Money
    }
    compareAtPrice {
      ...Money
    }
    image {
      ...Image
    }
  }
  ${moneyFragment}
  ${imageFragment}
`;

export const productSummaryFragment = /* GraphQL */ `
  fragment ProductSummary on Product {
    id
    handle
    title
    vendor
    availableForSale
    tags
    featuredImage {
      ...Image
    }
    priceRange {
      minVariantPrice {
        ...Money
      }
      maxVariantPrice {
        ...Money
      }
    }
  }
  ${moneyFragment}
  ${imageFragment}
`;

export const productFragment = /* GraphQL */ `
  fragment Product on Product {
    id
    handle
    title
    description
    descriptionHtml
    vendor
    productType
    tags
    availableForSale
    createdAt
    updatedAt
    featuredImage {
      ...Image
    }
    images(first: 20) {
      nodes {
        ...Image
      }
    }
    options {
      id
      name
      values
    }
    variants(first: 100) {
      nodes {
        ...ProductVariant
      }
    }
    priceRange {
      minVariantPrice {
        ...Money
      }
      maxVariantPrice {
        ...Money
      }
    }
    seo {
      title
      description
    }
  }
  ${productVariantFragment}
`;

export const collectionFragment = /* GraphQL */ `
  fragment Collection on Collection {
    id
    handle
    title
    description
    descriptionHtml
    image {
      ...Image
    }
    seo {
      title
      description
    }
    products(first: $productsFirst) {
      nodes {
        ...ProductSummary
      }
    }
  }
  ${productSummaryFragment}
`;

export const cartFragment = /* GraphQL */ `
  fragment Cart on Cart {
    id
    checkoutUrl
    totalQuantity
    note
      attributes {
        key
        value
      }
    cost {
      subtotalAmount {
        ...Money
      }
      totalAmount {
        ...Money
      }
      totalTaxAmount {
        ...Money
      }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        cost {
          totalAmount {
            ...Money
          }
          amountPerQuantity {
            ...Money
          }
        }
        merchandise {
          ... on ProductVariant {
            id
            title
            selectedOptions {
              name
              value
            }
            price {
              ...Money
            }
            product {
              id
              handle
              title
              featuredImage {
                ...Image
              }
            }
          }
        }
      }
    }
  }
  ${moneyFragment}
  ${imageFragment}
`;
