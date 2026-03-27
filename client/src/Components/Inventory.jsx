import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Inventory.css";

const Inventory = () => {
  const [items, setItems] = useState([]);

  const [form, setForm] = useState({
    itemName: "",
    category: "",
    warehouseLocation: "",
    quantity: "",
    expiryDate: "",
  });

  const BASE_URL = "http://localhost:3001/api";

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    const res = await axios.get(`${BASE_URL}/inventory`);
    setItems(res.data);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const getStatus = (qty, expiry) => {
    const today = new Date();
    const exp = new Date(expiry);

    if (qty < 100) return "Low";
    if (exp < today) return "Expired";

    const diffDays = (exp - today) / (1000 * 60 * 60 * 24);
    if (diffDays < 7) return "Expiring";

    return "OK";
  };

  const addItem = async () => {
    const { itemName, category, warehouseLocation, quantity, expiryDate } = form;

    if (!itemName || !quantity) return alert("Fill required fields");

    const status = getStatus(quantity, expiryDate);

    await axios.post(`${BASE_URL}/inventory`, {
      ...form,
      status,
    });

    setForm({
      itemName: "",
      category: "",
      warehouseLocation: "",
      quantity: "",
      expiryDate: "",
    });

    fetchInventory();
  };

  const deleteItem = async (id) => {
    await axios.delete(`${BASE_URL}/inventory/${id}`);
    fetchInventory();
  };

  // SUMMARY DATA
  const totalItems = items.length;
  const lowStock = items.filter((i) => i.quantity < 100).length;
  const expiring = items.filter((i) => i.status === "Expiring").length;
  const warehouses = [...new Set(items.map((i) => i.warehouseLocation))].length;

  return (
    <div className="inv-page">
      <h1 className="inv-title">Inventory Management</h1>

      {/* SUMMARY */}
      <div className="inv-summary">
        <div>Total Items: {totalItems}</div>
        <div>Low Stock: {lowStock}</div>
        <div>Expiring Soon: {expiring}</div>
        <div>Warehouses: {warehouses}</div>
      </div>

      <div className="inv-card">
        {/* FORM */}
        <div className="inv-add-section">
          <input name="itemName" placeholder="Item Name" value={form.itemName} onChange={handleChange} />
          <input name="category" placeholder="Category" value={form.category} onChange={handleChange} />
          <input name="warehouseLocation" placeholder="Warehouse" value={form.warehouseLocation} onChange={handleChange} />
          <input name="quantity" type="number" placeholder="Qty" value={form.quantity} onChange={handleChange} />
          <input name="expiryDate" type="date" value={form.expiryDate} onChange={handleChange} />

          <button onClick={addItem}>+ Add</button>
        </div>

        {/* TABLE */}
        <table className="inv-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Warehouse</th>
              <th>Qty</th>
              <th>Expiry</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td>{item.itemName}</td>
                <td>{item.category}</td>
                <td>{item.warehouseLocation}</td>
                <td>{item.quantity}</td>
                <td>
                  {item.expiryDate
                    ? new Date(item.expiryDate).toLocaleDateString()
                    : "N/A"}
                </td>
                <td>{item.status}</td>
                <td>
                  <button onClick={() => deleteItem(item._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;