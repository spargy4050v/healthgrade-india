const axios = require('axios');

module.exports = async (req, res) => {
  // Ensure it’s a POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, use POST' });
  }

  try {
    // Get input from request body
    const { barcode, product } = req.body;

    if (!barcode && !product) {
      return res.status(400).json({ error: 'Provide barcode or product name' });
    }

    // Use barcode if provided, else search by product name
    let url;
    if (barcode) {
      url = `https://world.openfoodfacts.org/api/v2/product/${barcode}`;
    } else {
      url = `https://world.openfoodfacts.org/api/v2/search?search_terms=${encodeURIComponent(product)}&page_size=1`;
    }

    // Fetch data from Open Food Facts
    const response = await axios.get(url);
    const data = response.data;

    // Handle barcode lookup
    if (barcode) {
      if (data.status === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      const productData = data.product;
      return res.status(200).json({
        product: productData.product_name || 'Unknown',
        nutri_score: productData.nutriscore_grade?.toUpperCase() || 'Not available',
        barcode: productData.code
      });
    }

    // Handle product name search
    if (data.products && data.products.length > 0) {
      const firstProduct = data.products[0];
      return res.status(200).json({
        product: firstProduct.product_name || product,
        nutri_score: firstProduct.nutriscore_grade?.toUpperCase() || 'Not available',
        barcode: firstProduct.code
      });
    }

    return res.status(404).json({ error: 'Product not found' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
};
