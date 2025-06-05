const express = require("express");

const router = express.Router();

// 📌 Helper function to get monthly sales data
const getMonthlySales = async () => {
  const orders = await Order.find({ status: "Completed" });
  const monthlySales = {};

  orders.forEach((order) => {
    const month = new Date(order.createdAt).toLocaleString("default", { month: "short" });
    monthlySales[month] = (monthlySales[month] || 0) + order.totalAmount;
  });

  return Object.entries(monthlySales).map(([month, totalSales]) => ({ month, totalSales }));
};

// 📌 Get Detailed Sales Report
router.get("/sales", async (req, res) => {
  try {
    const orders = await Order.find({ status: "Completed" });
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalProductsSold = orders.reduce((sum, order) => sum + order.items.length, 0);
    const peakOrderTimes = orders.map(order => new Date(order.createdAt).getHours());
    const peakOrderHours = [...new Set(peakOrderTimes)].sort((a, b) => peakOrderTimes.filter(h => h === b).length - peakOrderTimes.filter(h => h === a).length).slice(0, 3);

    const salesByMonth = await getMonthlySales();

    // 📌 Best & Least Selling Products
    const productSales = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        productSales[item.product] = (productSales[item.product] || 0) + 1;
      });
    });

    const bestSellingProduct = Object.keys(productSales).reduce((a, b) => (productSales[a] > productSales[b] ? a : b), null);
    const leastSellingProduct = Object.keys(productSales).reduce((a, b) => (productSales[a] < productSales[b] ? a : b), null);

    res.json({
      totalRevenue,
      totalProductsSold,
      salesByMonth,
      peakOrderTimes: peakOrderHours.map(h => `${h}:00 - ${h + 1}:00`),
      bestSellingProduct,
      leastSellingProduct
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching sales data" });
  }
});

// 📌 Get Category-wise Sales Report
router.get("/category-sales", async (req, res) => {
  try {
    const products = await Product.find();
    const orders = await Order.find({ status: "Completed" });

    const categorySales = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p._id.toString() === item.product.toString());
        if (product) {
          categorySales[product.category] = (categorySales[product.category] || 0) + item.quantity;
        }
      });
    });

    res.json(categorySales);
  } catch (error) {
    res.status(500).json({ error: "Error fetching category sales data" });
  }
});

// 📌 Get Returns & Cancellations Report
router.get("/returns", async (req, res) => {
  try {
    const returnedOrders = await Order.find({ status: "Returned" });

    const returnCounts = {};
    returnedOrders.forEach(order => {
      order.items.forEach(item => {
        returnCounts[item.product] = (returnCounts[item.product] || 0) + 1;
      });
    });

    const mostReturnedProduct = Object.keys(returnCounts).reduce((a, b) => (returnCounts[a] > returnCounts[b] ? a : b), null);

    res.json([{ productName: mostReturnedProduct, count: returnCounts[mostReturnedProduct] }]);
  } catch (error) {
    res.status(500).json({ error: "Error fetching return data" });
  }
});

module.exports = router;
