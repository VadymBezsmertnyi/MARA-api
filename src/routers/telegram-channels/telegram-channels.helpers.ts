export const performAIVerification = async (
  name: string,
  description?: string
): Promise<{ isSafe: boolean; reason?: string }> => {
  const suspiciousKeywords = ["scam", "fraud", "illegal", "hack", "spam"];
  const textToCheck = `${name} ${description || ""}`.toLowerCase();
  const hasSuspiciousContent = suspiciousKeywords.some((keyword) =>
    textToCheck.includes(keyword)
  );
  if (hasSuspiciousContent)
    return {
      isSafe: false,
      reason: "Channel contains suspicious content",
    };

  await new Promise((resolve) => setTimeout(resolve, 1000));

  return { isSafe: true };
};
