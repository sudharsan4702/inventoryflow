import React, { useState, useEffect } from "react";
import { Table, Button, Form, Modal } from "react-bootstrap";
import axios from "axios";

function Inventory() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    quantity: "",
    price: "",
    image: null,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token"); // Get token from local storage
      const response = await axios.get("http://localhost:5000/products", {
        headers: { Authorization: `Bearer ${token}` }, // Send token
      });
      setProducts(response.data);
    } catch (error) {
      console.error(error.response?.data || "Error fetching products");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, image: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const formDataObj = new FormData();
    Object.keys(formData).forEach((key) => formDataObj.append(key, formData[key]));

    try {
      if (editingProduct) {
        // Update existing product
        await axios.put(`http://localhost:5000/update-product/${editingProduct._id}`, formDataObj, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Add new product
        await axios.post("http://localhost:5000/add-product", formDataObj, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      fetchProducts();
      setShowModal(false);
      setEditingProduct(null);
    } catch (error) {
      console.error(error.response?.data || "Error saving product");
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowModal(true);
    setFormData({
      name: product.name,
      category: product.category,
      quantity: product.quantity,
      price: product.price,
      image: null, // Do not pre-fill image
    });
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/delete-product/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducts();
    } catch (error) {
      console.error(error.response?.data || "Error deleting product");
    }
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Inventory</h1>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <Form.Control type="text" placeholder="Search by product name or category" className="w-50 me-3" />
        <Button variant="primary" onClick={() => setShowModal(true)}>Add New Item</Button>
      </div>

      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>Image</th>
            <th>Product Name</th>
            <th>Category</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
            <tr key={product._id}>
              <td>{index + 1}</td>
              <td>
                {product.image ? (
                  <img
                    src={`http://localhost:5000${product.image}`}
                    alt={product.name}
                    width="50"
                    height="50"
                    style={{ objectFit: "cover", borderRadius: "5px" }}
                  />
                ) : (
                  "No Image"
                )}
              </td>
              <td>{product.name}</td>
              <td>{product.category}</td>
              <td>{product.quantity}kg</td>
              <td>₹{product.price}</td>
              <td>
                <Button variant="outline-warning" size="sm" onClick={() => handleEdit(product)}>Edit</Button>{" "}
                <Button variant="outline-danger" size="sm" onClick={() => handleDelete(product._id)}>Remove</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Add/Edit Product Modal */}
      <Modal show={showModal} onHide={() => { setShowModal(false); setEditingProduct(null); }}>
        <Modal.Header closeButton>
          <Modal.Title>{editingProduct ? "Edit Product" : "Add Product"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group>
              <Form.Label>Product Name</Form.Label>
              <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required />
            </Form.Group>
            <Form.Group>
              <Form.Label>Category</Form.Label>
              <Form.Control type="text" name="category" value={formData.category} onChange={handleChange} required />
            </Form.Group>
            <Form.Group>
              <Form.Label>Quantity</Form.Label>
              <Form.Control type="number" name="quantity" value={formData.quantity} onChange={handleChange} required />
            </Form.Group>
            <Form.Group>
              <Form.Label>Price</Form.Label>
              <Form.Control type="number" name="price" value={formData.price} onChange={handleChange} required />
            </Form.Group>
            <Form.Group>
              <Form.Label>Image (Optional)</Form.Label>
              <Form.Control type="file" onChange={handleFileChange} />
            </Form.Group>
            <Button type="submit" className="mt-3">{editingProduct ? "Update Product" : "Add Product"}</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Inventory;
