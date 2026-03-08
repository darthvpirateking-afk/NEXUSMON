export async function fetchSupplyNetwork() {
  const response = await fetch("/supply/network");
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Supply network request failed: ${response.status}`);
  }
  return response.json();
}