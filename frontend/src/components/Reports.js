import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import "bootstrap/dist/css/bootstrap.min.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

function Reports() {
  const [salesData, setSalesData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [categorySales, setCategorySales] = useState({});
  const [returnsData, setReturnsData] = useState([]);
  const [loadingError, setLoadingError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Token:", token); // Check if token exists

    const fetchData = async () => {
      try {
        const [salesRes, ordersRes, productsRes, categoryRes, returnsRes] = await Promise.all([
          axios.get("http://localhost:5000/sales", { headers: { Authorization: `Bearer ${token}` } }),
          axios.get("http://localhost:5000/orders", { headers: { Authorization: `Bearer ${token}` } }),
          axios.get("http://localhost:5000/products", { headers: { Authorization: `Bearer ${token}` } }),
          axios.get("http://localhost:5000/category-sales", { headers: { Authorization: `Bearer ${token}` } }),
          axios.get("http://localhost:5000/returns", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        console.log("Sales Data:", salesRes.data);
        console.log("Orders:", ordersRes.data);
        console.log("Inventory:", productsRes.data);
        console.log("Category Sales:", categoryRes.data);
        console.log("Returns Data:", returnsRes.data);

        setSalesData(salesRes.data);
        setOrders(ordersRes.data);
        setInventory(productsRes.data);
        setCategorySales(categoryRes.data);
        setReturnsData(returnsRes.data);
      } catch (error) {
        console.error("Error fetching data:", error.response?.data || error.message);
        setLoadingError(error.response?.data?.message || "Failed to load reports");
      }
    };

    if (token) fetchData();
    else setLoadingError("No authentication token found. Please log in.");
  }, []);

  if (loadingError) {
    return (
      <div className="text-center mt-5">
        <p className="text-danger">{loadingError}</p>
      </div>
    );
  }

  if (!salesData || !orders.length || !inventory.length || !Object.keys(categorySales).length) {
    return <div className="text-center mt-5"><p>Loading detailed reports...</p></div>;
  }

  // Detailed Metrics
  const peakOrderHours = salesData.peakOrderTimes.join(", ");
  const inventoryTurnoverRate = (salesData.totalProductsSold / inventory.length).toFixed(2);
  const mostReturnedProduct = returnsData.length ? returnsData[0].productName : "N/A";
  const canceledOrders = orders.filter(order => order.status === "Canceled");
  const mostCanceledProduct = canceledOrders.length
    ? canceledOrders.reduce((acc, order) => {
        order.items.forEach(item => {
          acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
        });
        return acc;
      }, {})
    : {};
  const topCanceledProduct = Object.entries(mostCanceledProduct).sort((a, b) => b[1] - a[1])[0];
  const topCanceledProductName = topCanceledProduct
    ? inventory.find(p => p._id.toString() === topCanceledProduct[0])?.name || "Unknown"
    : "N/A";

  // Chart Data
  const categorySalesChart = {
    labels: Object.keys(categorySales),
    datasets: [
      {
        label: "Sales by Category",
        data: Object.values(categorySales),
        backgroundColor: ["#ff6384", "#36a2eb", "#ffce56", "#4bc0c0", "#9966ff"],
      },
    ],
  };

  const hourlyOrderDistribution = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: "Orders per Hour",
        data: Array(24).fill(0).map((_, hour) =>
          orders.filter(o => new Date(o.createdAt).getHours() === hour).length
        ),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  return (
    <div className="container mt-5">
      <h1 className="mb-4 text-primary fw-bold">Detailed Reports & Analytics</h1>

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card shadow-sm p-4">
            <h4 className="text-muted">Hourly Order Distribution</h4>
            <Bar
              data={hourlyOrderDistribution}
              options={{ scales: { y: { beginAtZero: true, title: { display: true, text: "Number of Orders" } } } }}
            />
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm p-4">
            <h4 className="text-muted">Peak Order Hours</h4>
            <p className="fs-5">{peakOrderHours}</p>
            <h4 className="text-muted mt-3">Most Canceled Product</h4>
            <p className="fs-5">{topCanceledProductName} ({topCanceledProduct ? topCanceledProduct[1] : 0} units)</p>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card shadow-sm p-4">
            <h4 className="text-muted">Category Sales Breakdown</h4>
            <Pie data={categorySalesChart} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm p-4">
            <h4 className="text-muted">Most Returned Product</h4>
            <p className="fs-5">{mostReturnedProduct} ({returnsData.length ? returnsData[0].count : 0} returns)</p>
            <h4 className="text-muted mt-3">Inventory Turnover Rate</h4>
            <p className="fs-5">{inventoryTurnoverRate} (products sold per item in stock)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;