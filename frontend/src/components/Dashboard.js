import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, Table, Row, Col, Container } from "react-bootstrap";
import { Bar } from "react-chartjs-2";
import { FaShoppingCart, FaBoxOpen, FaCheckCircle, FaExclamationTriangle,FaRupeeSign } from "react-icons/fa";

function Dashboard() {
  const [totalSales, setTotalSales] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [inventoryCount, setInventoryCount] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [completedOrders, setCompletedOrders] = useState(0);
  const [canceledOrders, setCanceledOrders] = useState(0);
  const [lowStock, setLowStock] = useState([]);
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [salesChartData, setSalesChartData] = useState(null);
  const [salesChange, setSalesChange] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/dashboard-data", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const {
        totalSales = 0,
        totalOrders = 0,
        inventoryCount = 0,
        pendingOrders = 0,
        completedOrders = 0,
        canceledOrders = 0,
        lowStock = [],
        topSellingProducts = [],
        salesChange = "0.00",
        monthlySales = [],
      } = response.data;

      setTotalSales(totalSales);
      setTotalOrders(totalOrders);
      setInventoryCount(inventoryCount);
      setPendingOrders(pendingOrders);
      setCompletedOrders(completedOrders);
      setCanceledOrders(canceledOrders);
      setLowStock(lowStock);
      setTopSellingProducts(topSellingProducts);
      setSalesChange(salesChange);

      setSalesChartData({
        labels: monthlySales.map((item) => item.month),
        datasets: [
          {
            label: "Monthly Sales (₹)",
            data: monthlySales.map((item) => item.sales),
            backgroundColor: "rgba(54, 162, 235, 0.7)",
            borderRadius: 10,
          },
        ],
      });
      console.log("Low Stock Data:", lowStock);


    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const [recentOrders, setRecentOrders] = useState([]);

useEffect(() => {
  // fetchDashboardData();
  fetchRecentOrders();
}, []);

const fetchRecentOrders = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get("http://localhost:5000/recent-orders", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setRecentOrders(response.data);
  } catch (error) {
    console.error("Error fetching recent orders:", error);
  }
};

const [weeklySalesData, setWeeklySalesData] = useState(null);

const fetchWeeklySales = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get("http://localhost:5000/weekly-sales",{
      headers: { Authorization: `Bearer ${token}` },
    });
    setWeeklySalesData({
      labels: response.data.map((item) => item._id),
      datasets: [
        {
          label: "Daily Sales (₹)",
          data: response.data.map((item) => item.totalSales),
          backgroundColor: "rgba(75, 192, 192, 0.7)",
          borderRadius: 10,
        },
      ],
    });
  } catch (error) {
    console.error("Error fetching weekly sales:", error);
  }
};

useEffect(() => {
  fetchWeeklySales();
}, []);


  return (
    <Container fluid className="mt-4">
      <h1 className="mb-4 text-primary fw-bold">📊 Admin Dashboard</h1>

      {/* 🔹 Key Metrics Section */}
      <Row className="g-4">
        {[
          { title: "Total Order Value", value: `₹${totalSales.toLocaleString()}`, icon: <FaShoppingCart />, color: "primary" },
          { title: "Total Orders", value: totalOrders, icon: <FaBoxOpen />, color: "info" },
          { title: "Pending Orders", value: pendingOrders, icon: <FaExclamationTriangle />, color: "warning" },
          { title: "Completed Orders", value: completedOrders, icon: <FaCheckCircle />, color: "success" },
          { title: "Avg Order Value of Cart", value: totalOrders > 0 ? `₹${(totalSales / totalOrders).toFixed(2)}` : "₹0.00", icon: <FaRupeeSign />, color: "dark" },

        ].map((metric, index) => (
          <Col key={index} md={3} sm={6} xs={12}>
            <Card className={`shadow-sm h-100 border-0 rounded-lg bg-${metric.color} text-white`}>
              <Card.Body className="d-flex align-items-center justify-content-between">
                <div>
                  <Card.Title className="fw-semibold">{metric.title}</Card.Title>
                  <h3 className="fw-bold">{metric.value}</h3>
                  {metric.title === "Total Sales" && (
                    <p className={salesChange >= 0 ? "text-light" : "text-danger"}>
                      {salesChange >= 0 ? `+${salesChange}%` : `${salesChange}%`} from last week
                    </p>
                  )}
                </div>
                <div className="display-5">{metric.icon}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 🔹 Low Stock & Top Selling Products */}
      <Row className="mt-4 g-4">
        <Col md={6}>
          <Card className="shadow-sm border-0 rounded-lg h-100">
            <Card.Body>
              <Card.Title className="text-danger fw-bold">⚠️ Low Stock Alerts</Card.Title>
              {lowStock.length > 0 ? (
                <Table striped bordered hover responsive className="mt-3">
                  <thead className="table-danger">
                    <tr>
                      <th>Product</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.map((product) => (
                      <tr key={product._id}>
                        <td>{product.name}</td>
                        <td className="text-danger fw-semibold">{product.quantity}kg</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-success mt-3">✅ All products in stock</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="shadow-sm border-0 rounded-lg h-100">
            <Card.Body>
              <Card.Title className="text-success fw-bold">🔥 Top Selling Products</Card.Title>
              {topSellingProducts.length > 0 ? (
                <Table striped bordered hover responsive className="mt-3">
                  <thead className="table-success">
                    <tr>
                      <th>Product</th>
                      <th>Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSellingProducts.map((product) => (
                      <tr key={product._id}>
                        <td>{product.name}</td>
                        <td className="text-primary fw-semibold">{product.orderCount || product.totalOrders}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="mt-3">No top-selling products yet</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4 g-4">
  <Col md={8}>
    <Card className="shadow-sm border-0 rounded-lg h-100">
      <Card.Body>
        <Card.Title className="fw-bold">📦 Recent Orders</Card.Title>
        {recentOrders.length > 0 ? (
          <Table striped bordered hover responsive className="mt-3">
            <thead className="table-primary">
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Total (₹)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order._id}>
                  <td>{order._id.slice(-6)}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="fw-bold text-success">₹{order.totalAmount}</td>
                  <td>
                    <span className={`badge bg-${order.status === "Pending" ? "warning" : order.status === "Completed" ? "success" : "danger"}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <p className="mt-3">No recent orders available</p>
        )}
      </Card.Body>
    </Card>
  </Col>
</Row>


      {/* 🔹 Sales Chart Section */}
      <Row className="mt-4 g-4">
        <Col md={6}>
          <Card className="shadow-sm border-0 rounded-lg h-100">
            <Card.Body>
              <Card.Title className="fw-bold">📈 Sales Overview</Card.Title>
              {salesChartData ? (
                <Bar data={salesChartData} options={{ maintainAspectRatio: true }} />
              ) : (
                <p className="mt-3">Loading sales data...</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
    <Card className="shadow-sm border-0 rounded-lg h-100">
      <Card.Body>
        <Card.Title className="fw-bold">📊 Weekly Sales Trend</Card.Title>
        {weeklySalesData ? (
          <Bar data={weeklySalesData} options={{ maintainAspectRatio: true }} />
        ) : (
          <p className="mt-3">Loading sales data...</p>
        )}
      </Card.Body>
    </Card>
  </Col>
      </Row>

      

    </Container>
  );
}

export default Dashboard;
