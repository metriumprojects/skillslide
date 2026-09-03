export const isSellerProfileComplete = (user) =>
  Boolean(user?.sellerName?.trim() && user?.dateOfBirth && user?.country?.trim());
