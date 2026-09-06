import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "../components/UserLayout";
import api from "../services/api";

function SubmitComplaint() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: "", description: "", category: "", priority: "Medium" });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose a valid image file."); return; }
    if (file.size > 50 * 1024 * 1024) { setError("Image must be 50 MB or smaller."); return; }
    setError("");
    if (preview) URL.revokeObjectURL(preview);
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (preview) URL.revokeObjectURL(preview);
    setImage(null); setPreview("");
  };

  const submitComplaint = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("category", formData.category);
      data.append("priority", formData.priority);
      if (image) data.append("image", image);
      const token = localStorage.getItem("token");
      const response = await api.post("/complaints", data, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) { alert("Complaint Submitted Successfully!"); navigate("/complaints"); }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to submit complaint.");
    } finally { setLoading(false); }
  };

  return (
    <UserLayout>
      <section className="rx-page-head compact">
        <div>
          <div className="rx-kicker">NEW REPORT / 02</div>
          <h1 className="rx-display">Write a complaint.</h1>
          <p className="rx-lede">Give your issue enough context to make resolution faster.</p>
        </div>
        <div className="rx-form-index">02<span>/04</span></div>
      </section>

      <div className="rx-rule" />

      <form onSubmit={submitComplaint} className="rx-form-layout">
        <div className="rx-panel rx-form-panel">
          <div className="rx-form-section">
            <div className="rx-form-label"><span>01</span><div><strong>Issue details</strong><small>Start with the essentials.</small></div></div>
            <div className="rx-form-fields">
              <label>Complaint title<input name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Water supply issue in Block B" required /></label>
              <label>Description<textarea name="description" value={formData.description} onChange={handleChange} placeholder="Explain what happened, where it happened, and anything important to know..." rows="7" required /></label>
            </div>
          </div>

          <div className="rx-form-section">
            <div className="rx-form-label"><span>02</span><div><strong>Classification</strong><small>Help route the issue correctly.</small></div></div>
            <div className="rx-form-two">
              <label>Category<select name="category" value={formData.category} onChange={handleChange} required><option value="">Select category</option><option>Infrastructure</option><option>Hostel</option><option>Transport</option><option>Electricity</option><option>Water</option><option>Academic</option><option>Other</option></select></label>
              <label>Priority<select name="priority" value={formData.priority} onChange={handleChange}><option>Low</option><option>Medium</option><option>High</option></select></label>
            </div>
          </div>

          <div className="rx-form-section last">
            <div className="rx-form-label"><span>03</span><div><strong>Evidence</strong><small>Optional, but useful for visual issues.</small></div></div>
            <div className="rx-upload">
              <input id="complaint-image" type="file" accept="image/*" onChange={handleImageChange} />
              <label htmlFor="complaint-image" className="rx-upload-inner">
                <span className="rx-upload-icon">＋</span><span><strong>{image ? "Replace image" : "Attach an image"}</strong><small>Optional · JPG, PNG, WEBP · up to 50 MB</small></span><b>Browse ↗</b>
              </label>
            </div>
            {preview && <div className="rx-preview"><img src={preview} alt="Complaint preview" /><div><strong>{image?.name}</strong><small>{(image.size / (1024 * 1024)).toFixed(2)} MB</small></div><button type="button" onClick={removeImage}>Remove</button></div>}
          </div>

          {error && <div className="rx-form-error">{error}</div>}

          <div className="rx-form-actions">
            <button type="button" className="rx-cancel" onClick={() => navigate("/dashboard")}>Cancel</button>
            <button type="submit" disabled={loading} className="rx-primary-btn submit">{loading ? "Submitting..." : "Submit complaint ↗"}</button>
          </div>
        </div>

        <aside className="rx-form-aside">
          <div className="rx-kicker">RESOLUTION FLOW</div>
          <h2>Clear in. Clear out.</h2>
          <p>Your complaint moves through a simple workflow so you can see what happens next.</p>
          <div className="rx-flow"><div><span>01</span><strong>Submitted</strong></div><i>↓</i><div><span>02</span><strong>Assigned</strong></div><i>↓</i><div><span>03</span><strong>In progress</strong></div><i>↓</i><div><span>04</span><strong>Resolved</strong></div></div>
        </aside>
      </form>
    </UserLayout>
  );
}

export default SubmitComplaint;
