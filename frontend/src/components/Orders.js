import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, Row, Col, Card, Button, ListGroup, Table } from "react-bootstrap";
import { FaPlus, FaMinus, FaShoppingCart } from "react-icons/fa";

function OrderPage() {
  const [products, setProducts] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios.get("http://localhost:5000/products", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((response) => setProducts(response.data))
      .catch((error) => console.error("Error fetching products:", error));

    axios.get("http://localhost:5000/orders", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((response) => setOrders(response.data.reverse()))
      .catch((error) => console.error("Error fetching orders:", error));
  }, []);

  const addToOrder = (product) => {
    setOrderItems((prevItems) => {
      const existingItem = prevItems.find(item => item.productId === product._id);
      if (existingItem) {
        return prevItems.map(item =>
          item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { productId: product._id, quantity: 1, price: product.price }];
    });
  };

  const increaseQuantity = (productId) => {
    setOrderItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQuantity = (productId) => {
    setOrderItems(prevItems =>
      prevItems
        .map(item =>
          item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter(item => item.quantity > 0)
    );
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const placeOrder = () => {
    if (orderItems.length === 0) {
      alert("No items in order!");
      return;
    }

    const token = localStorage.getItem("token");

    axios.post("http://localhost:5000/add-order",
      { items: orderItems, totalAmount },
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(() => {
        alert("Order placed successfully!");
        setOrderItems([]);

        axios.get("http://localhost:5000/orders", { headers: { Authorization: `Bearer ${token}` } })
          .then((response) => {
            setOrders(response.data.reverse());
          })
          .catch((error) => console.error("Error fetching updated orders:", error));
      })
      .catch((error) => {
        console.error("Error placing order:", error);
        alert("Error placing order. Check console for details.");
      });
  };

  const updateOrderStatus = (orderId, newStatus) => {
    const token = localStorage.getItem("token");

    axios.put(`http://localhost:5000/update-order/${orderId}`,
      { status: newStatus },
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(() => {
        alert("Order status updated!");
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === orderId ? { ...order, status: newStatus } : order
          )
        );
      })
      .catch((error) => {
        console.error("Error updating order status:", error);
        alert("Failed to update order status.");
      });
  };

  return (
    <Container className="my-4">
      <h2 className="">Order Management</h2>

      <Row className="mt-4">
        {/* Products Section */}
        <Col md={7}>
          <h3>Products</h3>
          <Row>
            {products.map((product) => (
              <Col key={product._id} md={3} className="mb-4">
                <Card className="shadow-sm border-0 rounded-lg h-100" style={{ minHeight: "250px" }}>
  {product.image && (
    <Card.Img
      variant="top"
      src={`http://localhost:5000${product.image}`}
      alt={product.name}
      style={{ height: "120px", objectFit: "cover" }} // Fixed image height
    />
  )}
  <Card.Body className="d-flex flex-column">
    <Card.Title className="text-truncate">{product.name}</Card.Title> {/* Prevents overflow */}
    <Card.Text className="mb-2">Price: ₹{product.price}</Card.Text>
    <Button variant="primary" className="mt-auto" onClick={() => addToOrder(product)}>
      <FaShoppingCart /> Add to Order
    </Button>
  </Card.Body>
</Card>

              </Col>
            ))}
          </Row>
        </Col>

        {/* Order Summary & Order History */}
        <Col md={5}>
          {/* Order Summary */}
          <h3>Order Summary</h3>
          {orderItems.length > 0 ? (
            <ListGroup>
              {orderItems.map((item) => {
                const product = products.find(p => p._id === item.productId) || {};
                return (
                  <ListGroup.Item key={item.productId} className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{product ? product.name : "Product not found"}</strong><br />
                      Quantity: {item.quantity}kg | Price: ₹{item.price}
                    </div>
                    <div>
                      <Button className="mx-1" variant="secondary" size="sm" onClick={() => decreaseQuantity(item.productId)} ><FaMinus /></Button>
                      {item.quantity}kg
                      <Button className="mx-1" variant="secondary" size="sm" onClick={() => increaseQuantity(item.productId)}><FaPlus /></Button>
                    </div>
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          ) : (
            <p>No items added to order.</p>
          )}
          <h4 className="mt-3">Total: ₹{totalAmount.toFixed(2)}</h4>
          <Button variant="success" className="mt-3" onClick={placeOrder}>Place Order</Button>

          {/* Order History */}
          <h3 className="mt-5">Order History</h3>
          {orders.length > 0 ? (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order._id}>
                    <td>{order._id}</td>
                    <td>₹{order.totalAmount.toFixed(2)}</td>
                    <td>
                      <select className="form-select" value={order.status} onChange={(e) => updateOrderStatus(order._id, e.target.value)}>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Canceled">Canceled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p>No orders placed yet.</p>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default OrderPage;
