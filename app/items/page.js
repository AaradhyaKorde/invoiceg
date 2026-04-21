"use client";

import { useEffect, useState } from "react";

const initialForm = { name: "", description: "", variants: "", basePrice: "" };

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  async function loadItems() {
    const res = await fetch("/api/items");
    const data = await res.json();
    setItems(data);
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      basePrice: Number(form.basePrice),
      variants: form.variants
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    };

    if (editingId) {
      await fetch(`/api/items/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setForm(initialForm);
    setEditingId(null);
    loadItems();
  }

  function startEdit(item) {
    setEditingId(item._id);
    setForm({
      name: item.name,
      description: item.description,
      variants: item.variants.join(", "),
      basePrice: String(item.basePrice),
    });
  }

  return (
    <main className="grid">
      <section className="card">
        <h2>{editingId ? "Edit Item" : "Add Item"}</h2>
        <form onSubmit={handleSubmit} className="form">
          <input
            placeholder="Item name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            placeholder="Variants (comma separated)"
            value={form.variants}
            onChange={(e) => setForm({ ...form, variants: e.target.value })}
          />
          <input
            placeholder="Base Price"
            type="number"
            min="0"
            step="0.01"
            required
            value={form.basePrice}
            onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
          />
          <button type="submit">{editingId ? "Update" : "Save"} Item</button>
        </form>
      </section>

      <section className="card">
        <h2>Saved Items</h2>
        <div className="list">
          {items.map((item) => (
            <div key={item._id} className="listItem">
              <div>
                <strong>{item.name}</strong>
                <p>{item.description}</p>
                <small>Variants: {item.variants.join(", ") || "None"}</small>
                <br />
                <small>Base Price: INR {Number(item.basePrice).toFixed(2)}</small>
              </div>
              <button onClick={() => startEdit(item)}>Edit</button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
