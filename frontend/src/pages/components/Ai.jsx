import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Zap, Info, ShoppingCart, Minus, Plus } from "lucide-react";

const getApiBase = () => import.meta.env.VITE_API_BASE || "https://product-recomendation-system.onrender.com";
const API_BASE = getApiBase();

export default function AIRecommendations() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantities, setQuantities] = useState({});
  const hasFetched = useRef(false);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("authToken") || localStorage.getItem("token");
        const res = await axios.post(`${API_BASE}/api/recommendations/generate`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data;

        const processed = (data.recommendations || []).map(p => ({
          ...p,
          price: p.price ?? 120,
          stock: p.stock ?? 100,
          distributor: p.distributor?.name || "Qwipo Wholesale",
        }));
        const initialQuantities = {};
        processed.forEach(p => (initialQuantities[p.product_id] = 1));

        setProducts(processed);
        setQuantities(initialQuantities);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load recommendations");
      } finally {
        setLoading(false);
      }
    };

    if (!hasFetched.current) {
      fetchRecommendations();
      hasFetched.current = true;
    }
  }, []);

  const updateQty = (id, val) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, Math.min(999, val)),
    }));
  };

  const handleAddToCart = (product) => {
    console.log("Added to cart:", { ...product, qty: quantities[product.product_id] || 1 });
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3">Generating AI recommendations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger text-center my-5" role="alert">
        {error}
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="recommended-products my-5 container">
      <h4 className="mb-4 text-center fw-bold" style={{ color: "#178573ff", marginTop: "100px" }}>
        <Zap className="inline-block me-2" size={24} /> AI Recommended Products Based on Your Order History
      </h4>

      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
        {products.map((p) => (
          <div className="col" key={p.product_id}>
            <div className="card h-100 shadow-sm border-0 rounded-4">
              <img
                src={p.image || `https://placehold.co/400x400?text=${encodeURIComponent(p.title || "Product")}`}
                className="card-img-top p-3"
                alt={p.title}
                onError={(e) => {
                  e.target.src = `https://placehold.co/400x400?text=${encodeURIComponent(p.title || "Product")}`;
                }}
              />
              <div className="card-body d-flex flex-column">
                <h5 className="card-title text-truncate">{p.title}</h5>
                <p className="text-muted small mb-1">{p.distributor}</p>
                <p className="text-success fw-semibold mb-2">Relevance: {(p.score * 100).toFixed(0)}%</p>

                <div className="bg-light rounded p-2 mb-3">
                  <small className="text-secondary">
                    <Info size={14} className="me-1" />
                    {p.reason || "AI rationale unavailable."}
                  </small>
                </div>

                <div className="d-flex align-items-center justify-content-between mt-auto">
                  <h5 className="fw-bold text-primary mb-0">₹{p.price.toFixed(2)}</h5>
                  <div className="input-group input-group-sm w-auto">
                    <button className="btn btn-outline-secondary" onClick={() => updateQty(p.product_id, (quantities[p.product_id] || 1) - 1)}>
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      className="form-control text-center"
                      style={{ width: "50px" }}
                      value={quantities[p.product_id] || 1}
                      onChange={(e) => updateQty(p.product_id, Number(e.target.value))}
                    />
                    <button className="btn btn-outline-secondary" onClick={() => updateQty(p.product_id, (quantities[p.product_id] || 1) + 1)}>
                      <Plus size={14} />
                    </button>
                  </div> 
                </div>

                <button
                  className="btn btn-success w-100 mt-3"
                  onClick={() => handleAddToCart(p)}
                >
                  <ShoppingCart size={16} className="me-2" /> Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
