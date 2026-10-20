
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  CalendarDays,
  Package,
  BarChart3,
  Settings,
  Search,
  Bell,
  Plus,
  ArrowUpRight,
  ArrowRight,
  Clock3,
  ChefHat,
  Sparkles,
  Leaf,
  Flame,
  CircleCheck,
  RefreshCw,
  Menu as MenuIcon,
} from "lucide-react";
import "./App.css";
import Login from "./Login";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");
async function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = sessionStorage.getItem("dineflowToken");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80";

const navigation = [
  { label: "Overview", icon: LayoutDashboard, page: "Dashboard" },
  { label: "Menu Management", icon: UtensilsCrossed, page: "Menu" },
  { label: "Orders & Kitchen", icon: ClipboardList, page: "Orders" },
  { label: "Tables & Reservations", icon: CalendarDays, page: "Tables" },
  { label: "Inventory", icon: Package, page: "Inventory" },
  { label: "Reports & Analytics", icon: BarChart3, page: "Reports" },
];

const categories = [
  "All",
  "Starters",
  "Soups & Salads",
  "Main Course",
  "Breads",
  "Rice & Biryani",
  "Desserts",
  "Beverages",
];

const pageInfo = {
  Dashboard: {
    eyebrow: "RESTAURANT OVERVIEW",
    title: "The art of hospitality.",
    subtitle:
      "Your restaurant at a glance. Thoughtful service starts with a clear picture.",
  },
  Menu: {
    eyebrow: "CULINARY COLLECTION",
    title: "A menu worth remembering.",
    subtitle:
      "Explore your dishes, discover your signatures and curate the guest experience.",
  },
  Orders: {
    eyebrow: "SERVICE & KITCHEN",
    title: "Every order, in harmony.",
    subtitle:
      "The order-processing module will connect your menu, kitchen and service team.",
  },
  Tables: {
    eyebrow: "GUEST EXPERIENCE",
    title: "Make room for something special.",
    subtitle:
      "Table management and reservation availability are the next modules to connect.",
  },
  Inventory: {
    eyebrow: "KITCHEN OPERATIONS",
    title: "Every ingredient matters.",
    subtitle:
      "Ingredient tracking, stock movements and automatic deductions are coming next.",
  },
  Reports: {
    eyebrow: "BUSINESS INTELLIGENCE",
    title: "The story behind every service.",
    subtitle:
      "Sales summaries, bestsellers and operational reporting will appear here.",
  },
  Settings: {
    eyebrow: "RESTAURANT PREFERENCES",
    title: "Your restaurant, your standards.",
    subtitle:
      "Restaurant profile, team access and operational preferences will be configured here.",
  },
};

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function FoodImage({ src, alt }) {
  const [failed, setFailed] = useState(false);

  return (
    <img
      className="food-image"
      src={failed || !src ? FALLBACK_IMAGE : src}
      alt={alt || "Restaurant dish"}
      loading="lazy"
      onError={() => {
        if (!failed) setFailed(true);
      }}
    />
  );
}

function MetricCard({ icon: Icon, label, value, note, accent }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon ${accent || ""}`}>
        <Icon size={19} strokeWidth={1.8} />
      </div>
      <p className="metric-label">{label}</p>
      <div className="metric-value">{value}</div>
      <p className="metric-note">{note}</p>
    </article>
  );
}

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [menuItems, setMenuItems] = useState([]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [apiError, setApiError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [ordersNotice, setOrdersNotice] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [reservations, setReservations] = useState([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [reservationsError, setReservationsError] = useState("");
  const [reservationsNotice, setReservationsNotice] = useState("");
  const [updatingReservationId, setUpdatingReservationId] = useState("");
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [inventoryError, setInventoryError] = useState("");
  const [inventoryNotice, setInventoryNotice] = useState("");
  const [updatingInventoryId, setUpdatingInventoryId] = useState("");
  const [inventorySearch, setInventorySearch] = useState("");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [stockQuantities, setStockQuantities] = useState({});
  const [reportsData, setReportsData] = useState(null);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportsError, setReportsError] = useState("");
  const [authToken, setAuthToken] = useState(
    () => sessionStorage.getItem("dineflowToken") || ""
  );
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);


  
  async function handleLogin(email, password) {
    const response = await apiFetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Login failed. Please try again.");
    }

    sessionStorage.setItem("dineflowToken", data.token);
    setCurrentUser(data.user);
    setAuthToken(data.token);
  }

  function handleLogout() {
    sessionStorage.removeItem("dineflowToken");
    setAuthToken("");
    setCurrentUser(null);
    setActivePage("Dashboard");
    setReportsData(null);
    setOrders([]);
    setReservations([]);
    setInventoryItems([]);
  }


  async function loadMenu() {
    setLoadingMenu(true);
    setApiError("");

    try {
      const response = await apiFetch(`${API_URL}/api/menu`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load the menu.");
      }

      setMenuItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setApiError(
        "Menu API se connect nahi ho raha. Check karo ki backend localhost:5000 par running hai."
      );
    } finally {
      setLoadingMenu(false);
    }
  }
  async function loadOrders() {
    setLoadingOrders(true);
    setOrdersError("");

    try {
      const response = await apiFetch(`${API_URL}/api/orders?limit=100`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not load orders.");
      }

      setOrders(data.orders || []);
    } catch (error) {
      setOrdersError(
        error.message || "Orders load nahi ho rahe. Backend check karo."
      );
    } finally {
      setLoadingOrders(false);
    }
  }

  async function loadReservations() {
    setLoadingReservations(true);
    setReservationsError("");

    try {
      const response = await apiFetch(
        `${API_URL}/api/reservations?limit=100`
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Could not load reservations."
        );
      }

      setReservations(data.reservations || []);
    } catch {
      setReservationsError(
        "Reservations load nahi ho rahi hain. Backend check karo."
      );
    } finally {
      setLoadingReservations(false);
    }
  }

  
  async function loadInventory() {
    setLoadingInventory(true);
    setInventoryError("");

    try {
      const response = await apiFetch(`${API_URL}/api/inventory`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not load inventory.");
      }

      setInventoryItems(data.items || []);
    } catch (error) {
      setInventoryError(
        error.message || "Inventory load nahi ho rahi hai."
      );
    } finally {
      setLoadingInventory(false);
    }
  }

  
  async function loadReports() {
    setLoadingReports(true);
    setReportsError("");

    try {
      const response = await apiFetch(`${API_URL}/api/reports`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not load reports.");
      }

      setReportsData(data);
    } catch (error) {
      setReportsError(
        error.message || "Reports load nahi ho rahi hain."
      );
    } finally {
      setLoadingReports(false);
    }
  }


  
  async function adjustInventoryStock(item, action) {
    const quantity = Number(stockQuantities[item._id]);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setInventoryError("Please enter a quantity greater than zero.");
      setInventoryNotice("");
      return;
    }

    setUpdatingInventoryId(item._id);
    setInventoryError("");
    setInventoryNotice("");

    try {
      const response = await fetch(
        `${API_URL}/api/inventory/${item._id}/stock`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            quantity,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Stock update failed.");
      }

      setInventoryNotice(
        `${data.item.name}: ${data.message} Current stock: ${data.item.currentStock} ${data.item.unit}.`
      );

      await loadInventory();
    } catch (error) {
      setInventoryError(
        error.message || "Inventory stock could not be updated."
      );
    } finally {
      setUpdatingInventoryId("");
    }
  }




  useEffect(() => {
    loadMenu();
  }, []);

  useEffect(() => {
    if (activePage === "Orders") {
      loadOrders();
    }
  }, [activePage]);

  useEffect(() => {
    if (activePage === "Tables") {
      loadReservations();
    }
  }, [activePage]);

  useEffect(() => {
    if (activePage === "Inventory") {
      loadInventory();
    }
  }, [activePage]);

  useEffect(() => {
    if (authToken && (activePage === "Reports" || activePage === "Dashboard")) {
      loadReports();
    }
  }, [activePage, authToken]);

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      if (!authToken) {
        setCurrentUser(null);
        setCheckingAuth(false);
        return;
      }

      setCheckingAuth(true);

      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error("Session expired.");
        }

        if (!cancelled) {
          setCurrentUser(data.user);
        }
      } catch {
        sessionStorage.removeItem("dineflowToken");

        if (!cancelled) {
          setAuthToken("");
          setCurrentUser(null);
        }
      } finally {
        if (!cancelled) {
          setCheckingAuth(false);
        }
      }
    }

    verifySession();

    return () => {
      cancelled = true;
    };
  }, [authToken]);



    
 

  
  async function updateReservationStatus(reservationId, status) {
    setUpdatingReservationId(reservationId);
    setReservationsError("");
    setReservationsNotice("");

    try {
      const response = await fetch(
        `${API_URL}/api/reservations/${reservationId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Could not update reservation."
        );
      }

      setReservationsNotice(
        `Reservation ${data.reservation.reservationNumber} updated to ${status}.`
      );

      await loadReservations();
    } catch (error) {
      setReservationsError(
        error.message || "Reservation status update nahi ho paya."
      );
    } finally {
      setUpdatingReservationId("");
    }
  }


  
  async function updateOrderStatus(orderId, status) {
    setUpdatingOrderId(orderId);
    setOrdersError("");
    setOrdersNotice("");

    try {
      const response = await apiFetch(
        `${API_URL}/api/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not update order status.");
      }

      setOrdersNotice(
        `Order ${data.order.orderNumber} updated to ${status}.`
      );

      await loadOrders();
    } catch (error) {
      setOrdersError(
        error.message || "Order status update nahi ho paya."
      );
    } finally {
      setUpdatingOrderId("");
    }
  }


  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return menuItems.filter((item) => {
      const matchesCategory =
        category === "All" || item.category === category;

      const matchesSearch =
        !query ||
        [item.name, item.description, item.category, ...(item.tags || [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [menuItems, category, search]);

  
  const filteredInventoryItems = useMemo(() => {
    const query = inventorySearch.trim().toLowerCase();

    return inventoryItems.filter((item) => {
      const matchesSearch =
        !query ||
        [item.name, item.sku, item.category, item.supplierName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStock =
        !showLowStockOnly ||
        item.currentStock <= item.reorderLevel;

      return matchesSearch && matchesStock;
    });
  }, [inventoryItems, inventorySearch, showLowStockOnly]);


  const featuredItems = menuItems.filter((item) => item.isFeatured);
  const currentPage = pageInfo[activePage] || pageInfo.Dashboard;

  function navigate(page) {
    setActivePage(page);
    setSidebarOpen(false);

    if (page === "Menu") {
      setCategory("All");
    }
  }
  if (checkingAuth) {
    return (
      <div className="auth-loading">
        <span>DineFlow</span>
        <p>Verifying your secure session...</p>
      </div>
    );
  }

  if (!authToken || !currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <button
          className="brand"
          onClick={() => navigate("Dashboard")}
          aria-label="Go to dashboard"
        >
          <span className="brand-symbol">
            <UtensilsCrossed size={23} />
          </span>
          <span className="brand-copy">
            <strong>DineFlow</strong>
            <small>THE ART OF DINING</small>
          </span>
        </button>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="sidebar-nav">
          {navigation.map(({ label, icon: Icon, page }) => (
            <button
              key={page}
              className={`nav-item ${
                activePage === page ? "nav-active" : ""
              }`}
              onClick={() => navigate(page)}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>
              {page === "Menu" && (
                <span className="nav-count">{menuItems.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-promo">
            <Sparkles size={20} />
            <strong>Exceptional, by design.</strong>
            <p>Every detail contributes to an unforgettable guest experience.</p>
          </div>

          <button
            className={`nav-item ${
              activePage === "Settings" ? "nav-active" : ""
            }`}
            onClick={() => navigate("Settings")}
          >
            <Settings size={19} />
            <span>Settings</span>
          </button>

          <div className="profile-row">
            <div className="profile-avatar">
              {(currentUser?.name || "DF").slice(0, 2).toUpperCase()}
            </div>

            <div className="profile-copy">
              <strong>{currentUser?.name || "Restaurant Admin"}</strong>
              <small>{currentUser?.role || "admin"}</small>
            </div>

            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="main-content">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setSidebarOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            <MenuIcon size={20} />
          </button>

          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-separator">/</span>
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-actions">
            <label className="top-search">
              <Search size={17} />
              <input
                aria-label="Search menu"
                placeholder="Search dishes..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  if (activePage !== "Menu") setActivePage("Menu");
                }}
              />
              <kbd>⌘ K</kbd>
            </label>

            <button
              className="icon-button notification-button"
              aria-label="Refresh menu"
              onClick={loadMenu}
              title="Refresh menu data"
            >
              <Bell size={19} />
              <span className="notification-dot" />
            </button>

            <div className="topbar-divider" />

            <div className="branch-info">
              <span className="branch-indicator" />
              <span>MAIN RESTAURANT</span>
            </div>
          </div>
        </header>

        <div className="page-container">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" />
                {currentPage.eyebrow}
              </div>
              <h1>{currentPage.title}</h1>
              <p className="page-subtitle">{currentPage.subtitle}</p>
            </div>

            <button className="primary-button" onClick={() => navigate("Menu")}>
              <Plus size={17} />
              Explore menu
            </button>
          </div>

          {apiError && (
            <div className="notice notice-error">
              <span>{apiError}</span>
              <button className="text-button" onClick={loadMenu}>
                <RefreshCw size={15} /> Retry
              </button>
            </div>
          )}

          {activePage === "Dashboard" && (
            <>
              <section className="welcome-banner">
                <div className="welcome-copy">
                  <span className="welcome-kicker">
                    <Sparkles size={14} /> A NEW STANDARD OF SERVICE
                  </span>
                  <h2>Where every detail<br />feels extraordinary.</h2>
                  <p>
                    A considered menu. A seamless service. A memorable evening.
                  </p>
                  <button
                    className="banner-button"
                    onClick={() => navigate("Menu")}
                  >
                    Discover the menu <ArrowRight size={16} />
                  </button>
                </div>
                <div className="welcome-image" role="img" aria-label="Elegant restaurant dining room">
                  <div className="welcome-image-caption">
                    <span>THE DINEFLOW EXPERIENCE</span>
                    <strong>Made for memorable moments.</strong>
                  </div>
                </div>
              </section>

              <div className="section-heading">
                <div>
                  <h2>Restaurant at a glance</h2>
                  <p>Your operational snapshot</p>
                </div>
                <span className="live-indicator">
                  <span /> MENU API {apiError ? "OFFLINE" : "CONNECTED"}
                </span>
              </div>

              
              <section className="metrics-grid">
                <MetricCard
                  icon={UtensilsCrossed}
                  label="Menu items"
                  value={loadingMenu ? "…" : menuItems.length}
                  note="Available in your menu database"
                  accent="gold"
                />

                <MetricCard
                  icon={ClipboardList}
                  label="Orders today"
                  value={
                    loadingReports && !reportsData
                      ? "…"
                      : reportsData?.overview.ordersToday ?? "—"
                  }
                  note={
                    reportsData
                      ? `${reportsData.overview.activeOrders} active orders`
                      : "Loading restaurant reports"
                  }
                  accent="violet"
                />

                <MetricCard
                  icon={CalendarDays}
                  label="Table reservations"
                  value={
                    loadingReports && !reportsData
                      ? "…"
                      : reportsData?.overview.reservationsToday ?? "—"
                  }
                  note="Reservations scheduled for today"
                  accent="blue"
                />

                <MetricCard
                  icon={Package}
                  label="Low-stock items"
                  value={
                    loadingReports && !reportsData
                      ? "…"
                      : reportsData?.overview.lowStockItems ?? "—"
                  }
                  note="Ingredients at or below reorder level"
                  accent="green"
                />
              </section>


              <section className="content-grid">
                <article className="panel featured-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Chef's selection</h2>
                      <p>A first look at the restaurant menu</p>
                    </div>
                    <button className="text-button" onClick={() => navigate("Menu")}>
                      View all <ArrowUpRight size={16} />
                    </button>
                  </div>

                  {loadingMenu ? (
                    <div className="empty-state">Loading signature dishes…</div>
                  ) : featuredItems.length ? (
                    <div className="featured-list">
                      {featuredItems.slice(0, 4).map((item) => (
                        <div className="featured-item" key={item._id}>
                          <FoodImage src={item.imageUrl} alt={item.name} />
                          <div className="featured-details">
                            <strong>{item.name}</strong>
                            <span>{item.category}</span>
                          </div>
                          <strong className="featured-price">
                            {formatPrice(item.price)}
                          </strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      {apiError || "Featured dishes will appear here."}
                    </div>
                  )}
                </article>

                <article className="panel operations-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Operations centre</h2>
                      <p>Restaurant modules</p>
                    </div>
                    <span className="round-icon">
                      <ChefHat size={19} />
                    </span>
                  </div>

                  <div className="operation-row">
                    <span className="operation-icon gold"><UtensilsCrossed size={17} /></span>
                    <div>
                      <strong>Menu management</strong>
                      <small>{menuItems.length} items configured</small>
                    </div>
                    <CircleCheck className="status-check" size={18} />
                  </div>
                  <div className="operation-row">
                    <span className="operation-icon purple"><ClipboardList size={17} /></span>
                    <div>
                      <strong>Orders & kitchen</strong>
                      <small>Next module to implement</small>
                    </div>
                    <Clock3 className="status-pending" size={18} />
                  </div>
                  <div className="operation-row">
                    <span className="operation-icon blue"><CalendarDays size={17} /></span>
                    <div>
                      <strong>Reservations</strong>
                      <small>Next module to implement</small>
                    </div>
                    <Clock3 className="status-pending" size={18} />
                  </div>
                  <div className="operation-row">
                    <span className="operation-icon green"><Package size={17} /></span>
                    <div>
                      <strong>Inventory</strong>
                      <small>Next module to implement</small>
                    </div>
                    <Clock3 className="status-pending" size={18} />
                  </div>
                </article>
              </section>

              <section className="panel menu-preview-panel">
                <div className="panel-heading">
                  <div>
                    <h2>A taste of the menu</h2>
                    <p>Real dishes loaded from your MongoDB-backed API</p>
                  </div>
                  <button className="text-button" onClick={() => navigate("Menu")}>
                    Explore collection <ArrowRight size={16} />
                  </button>
                </div>
                {loadingMenu ? (
                  <div className="empty-state">Loading menu items…</div>
                ) : menuItems.length ? (
                  <div className="mini-menu-grid">
                    {menuItems.slice(0, 3).map((item) => (
                      <article className="mini-menu-card" key={item._id}>
                        <div className="mini-image-wrap">
                          <FoodImage src={item.imageUrl} alt={item.name} />
                          {item.isFeatured && (
                            <span className="image-badge">
                              <Sparkles size={12} /> Signature
                            </span>
                          )}
                        </div>
                        <div className="mini-menu-info">
                          <div className="dish-name-row">
                            <strong>{item.name}</strong>
                            <span
                              className={`diet-mark ${
                                item.isVegetarian ? "veg-mark" : "nonveg-mark"
                              }`}
                              title={item.isVegetarian ? "Vegetarian" : "Non-vegetarian"}
                            >
                              {item.isVegetarian ? <Leaf size={12} /> : <Flame size={12} />}
                            </span>
                          </div>
                          <span>{item.category}</span>
                          <strong className="dish-price">{formatPrice(item.price)}</strong>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">No menu items found yet.</div>
                )}
              </section>
            </>
          )}

          {activePage === "Menu" && (
            <section className="panel menu-management-panel">
              <div className="panel-heading">
                <div>
                  <h2>Menu collection</h2>
                  <p>
                    {loadingMenu
                      ? "Fetching dishes from the restaurant database…"
                      : `${filteredItems.length} of ${menuItems.length} dishes`}
                  </p>
                </div>
                <button className="secondary-button" onClick={loadMenu}>
                  <RefreshCw size={16} /> Refresh menu
                </button>
              </div>

              <div className="category-filters">
                {categories.map((item) => (
                  <button
                    key={item}
                    className={`category-chip ${category === item ? "chip-active" : ""}`}
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {loadingMenu ? (
                <div className="empty-state">Loading your menu…</div>
              ) : filteredItems.length ? (
                <div className="menu-card-grid">
                  {filteredItems.map((item) => (
                    <article className="dish-card" key={item._id}>
                      <div className="dish-image-wrap">
                        <FoodImage src={item.imageUrl} alt={item.name} />
                        {item.isFeatured && (
                          <span className="image-badge">
                            <Sparkles size={12} /> Chef's signature
                          </span>
                        )}
                        <span
                          className={`diet-mark image-diet ${
                            item.isVegetarian ? "veg-mark" : "nonveg-mark"
                          }`}
                          title={item.isVegetarian ? "Vegetarian" : "Non-vegetarian"}
                        >
                          {item.isVegetarian ? <Leaf size={13} /> : <Flame size={13} />}
                        </span>
                      </div>

                      <div className="dish-card-body">
                        <span className="dish-category">{item.category}</span>
                        <h3>{item.name}</h3>
                        <p>{item.description}</p>
                        <div className="dish-card-footer">
                          <strong>{formatPrice(item.price)}</strong>
                          <span><Clock3 size={14} /> {item.preparationTimeMinutes || 15} min</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  No dishes match this filter. Try another category or search.
                </div>
              )}

              <div className="menu-admin-note">
                <Sparkles size={16} />
                <span>
                  Public menu browsing is connected. Secure add, edit and delete
                  actions will be added with administrator authentication.
                </span>
              </div>
            </section>
          )}

          
          {activePage === "Orders" && (
            <section className="panel orders-panel">
              <div className="panel-heading">
                <div>
                  <h2>Orders & Kitchen</h2>
                  <p>
                    {orders.length} order{orders.length === 1 ? "" : "s"} in
                    your order list
                  </p>
                </div>

                <button
                  className="secondary-button"
                  onClick={loadOrders}
                  disabled={loadingOrders}
                >
                  <RefreshCw size={16} />
                  {loadingOrders ? "Refreshing..." : "Refresh orders"}
                </button>
              </div>

              {ordersError && (
                <div className="notice notice-error">
                  <span>{ordersError}</span>
                  <button className="text-button" onClick={loadOrders}>
                    Retry
                  </button>
                </div>
              )}

              {ordersNotice && (
                <div className="notice notice-success">
                  <CircleCheck size={16} />
                  <span>{ordersNotice}</span>
                </div>
              )}

              {loadingOrders ? (
                <div className="empty-state">Loading restaurant orders...</div>
              ) : orders.length === 0 ? (
                <div className="empty-state">
                  <ClipboardList size={30} />
                  <strong>No orders yet</strong>
                  <span>New orders will appear here when created.</span>
                </div>
              ) : (
                <div className="orders-grid">
                  {orders.map((order) => {
                    const nextActions = {
                      Pending: {
                        label: "Confirm order",
                        next: "Confirmed",
                      },
                      Confirmed: {
                        label: "Start preparing",
                        next: "Preparing",
                      },
                      Preparing: {
                        label: "Mark ready",
                        next: "Ready",
                      },
                      Ready: {
                        label: "Mark served",
                        next: "Served",
                      },
                    };

                    const nextAction = nextActions[order.status];

                    return (
                      <article className="order-card" key={order._id}>
                        <div className="order-card-top">
                          <div>
                            <span className="order-overline">ORDER NUMBER</span>
                            <h3>{order.orderNumber}</h3>
                          </div>

                          <span
                            className={`order-status status-${order.status.toLowerCase()}`}
                          >
                            {order.status}
                          </span>
                        </div>

                        <div className="order-meta">
                          <span>
                            <Clock3 size={14} />
                            {new Date(order.createdAt).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span>{order.orderType}</span>
                          {order.orderType === "Dine-in" &&
                            order.tableNumber && (
                              <span>Table {order.tableNumber}</span>
                            )}
                        </div>

                        <div className="order-customer">
                          <div className="order-customer-avatar">
                            {(order.customerName || "G")
                              .trim()
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div>
                            <strong>{order.customerName}</strong>
                            <small>
                              {order.customerPhone || "Guest customer"}
                            </small>
                          </div>
                        </div>

                        <div className="order-items">
                          {(order.items || []).map((item, index) => (
                            <div
                              className="order-line"
                              key={`${item.menuItem}-${index}`}
                            >
                              <FoodImage
                                src={item.imageUrl}
                                alt={item.name}
                              />
                              <div className="order-line-details">
                                <strong>{item.name}</strong>
                                <small>
                                  {item.quantity} × {formatPrice(item.unitPrice)}
                                </small>
                              </div>
                              <strong className="order-line-total">
                                {formatPrice(item.lineTotal)}
                              </strong>
                            </div>
                          ))}
                        </div>

                        {order.specialInstructions && (
                          <div className="order-instructions">
                            <span>Kitchen note</span>
                            <p>{order.specialInstructions}</p>
                          </div>
                        )}

                        <div className="order-bill">
                          <div>
                            <span>Subtotal</span>
                            <span>{formatPrice(order.subtotal)}</span>
                          </div>
                          <div>
                            <span>Tax ({order.taxRate}%)</span>
                            <span>{formatPrice(order.taxAmount)}</span>
                          </div>
                          <div className="order-grand-total">
                            <strong>Total bill</strong>
                            <strong>{formatPrice(order.totalAmount)}</strong>
                          </div>
                        </div>

                        <div className="order-payment-row">
                          <span>Payment · {order.paymentMethod}</span>
                          <span
                            className={`payment-status payment-${order.paymentStatus.toLowerCase()}`}
                          >
                            {order.paymentStatus}
                          </span>
                        </div>

                        <div className="order-actions">
                          {nextAction ? (
                            <button
                              className="primary-button"
                              disabled={updatingOrderId === order._id}
                              onClick={() =>
                                updateOrderStatus(order._id, nextAction.next)
                              }
                            >
                              {updatingOrderId === order._id
                                ? "Updating..."
                                : nextAction.label}
                            </button>
                          ) : (
                            <div className="order-complete">
                              <CircleCheck size={16} />
                              {order.status === "Served"
                                ? "Order served"
                                : "Order cancelled"}
                            </div>
                          )}

                          {(order.status === "Pending" ||
                            order.status === "Confirmed") && (
                            <button
                              className="cancel-order-button"
                              disabled={updatingOrderId === order._id}
                              onClick={() =>
                                updateOrderStatus(order._id, "Cancelled")
                              }
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          
          {activePage === "Tables" && (
            <section className="panel reservations-panel">
              <div className="panel-heading">
                <div>
                  <h2>Tables & Reservations</h2>
                  <p>
                    {reservations.length} reservation
                    {reservations.length === 1 ? "" : "s"} in your booking list
                  </p>
                </div>

                <button
                  className="secondary-button"
                  onClick={loadReservations}
                  disabled={loadingReservations}
                >
                  <RefreshCw size={16} />
                  {loadingReservations ? "Refreshing..." : "Refresh bookings"}
                </button>
              </div>

              {reservationsError && (
                <div className="notice notice-error">
                  <span>{reservationsError}</span>
                  <button
                    className="text-button"
                    onClick={loadReservations}
                  >
                    Retry
                  </button>
                </div>
              )}

              {reservationsNotice && (
                <div className="notice notice-success">
                  <CircleCheck size={16} />
                  <span>{reservationsNotice}</span>
                </div>
              )}

              {loadingReservations ? (
                <div className="empty-state">
                  Loading restaurant reservations...
                </div>
              ) : reservations.length === 0 ? (
                <div className="empty-state">
                  <CalendarDays size={30} />
                  <strong>No reservations found</strong>
                  <span>Guest bookings will appear here.</span>
                </div>
              ) : (
                <div className="reservations-grid">
                  {reservations.map((reservation) => {
                    const nextActions = {
                      Pending: {
                        label: "Confirm booking",
                        next: "Confirmed",
                      },
                      Confirmed: {
                        label: "Mark guest seated",
                        next: "Seated",
                      },
                      Seated: {
                        label: "Complete booking",
                        next: "Completed",
                      },
                    };

                    const nextAction = nextActions[reservation.status];
                    const table =
                      reservation.table &&
                      typeof reservation.table === "object"
                        ? reservation.table
                        : null;

                    const startDate = new Date(reservation.startAt);
                    const endDate = new Date(reservation.endAt);

                    const dateIsValid =
                      !Number.isNaN(startDate.getTime()) &&
                      !Number.isNaN(endDate.getTime());

                    return (
                      <article
                        className="reservation-card"
                        key={reservation._id}
                      >
                        <div className="reservation-card-top">
                          <div>
                            <span className="order-overline">
                              RESERVATION NUMBER
                            </span>
                            <h3>{reservation.reservationNumber}</h3>
                          </div>

                          <span
                            className={`reservation-status status-${String(
                              reservation.status
                            ).toLowerCase()}`}
                          >
                            {reservation.status}
                          </span>
                        </div>

                        <div className="reservation-guest">
                          <div className="order-customer-avatar">
                            {(reservation.guestName || "G")
                              .trim()
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>{reservation.guestName}</strong>
                            <small>{reservation.guestPhone}</small>
                            {reservation.guestEmail && (
                              <small>{reservation.guestEmail}</small>
                            )}
                          </div>
                        </div>

                        <div className="reservation-details">
                          <div className="reservation-detail-row">
                            <CalendarDays size={17} />
                            <div>
                              <span>Date</span>
                              <strong>
                                {dateIsValid
                                  ? startDate.toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "Invalid date"}
                              </strong>
                            </div>
                          </div>

                          <div className="reservation-detail-row">
                            <Clock3 size={17} />
                            <div>
                              <span>Reservation time</span>
                              <strong>
                                {dateIsValid
                                  ? `${startDate.toLocaleTimeString("en-IN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })} – ${endDate.toLocaleTimeString(
                                      "en-IN",
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )}`
                                  : "Time unavailable"}
                              </strong>
                            </div>
                          </div>

                          <div className="reservation-detail-row">
                            <UtensilsCrossed size={17} />
                            <div>
                              <span>Assigned table</span>
                              <strong>
                                {table
                                  ? `${table.tableNumber} · ${table.section}`
                                  : "Table details unavailable"}
                              </strong>
                            </div>
                          </div>
                        </div>

                        <div className="reservation-guest-count">
                          <span>Guests</span>
                          <strong>{reservation.guestCount} people</strong>
                        </div>

                        {reservation.occasion &&
                          reservation.occasion !== "None" && (
                            <div className="reservation-occasion">
                              <Sparkles size={15} />
                              <span>{reservation.occasion}</span>
                            </div>
                          )}

                        {reservation.specialRequests && (
                          <div className="order-instructions">
                            <span>Guest requests</span>
                            <p>{reservation.specialRequests}</p>
                          </div>
                        )}

                        <div className="reservation-actions">
                          {nextAction ? (
                            <button
                              className="primary-button"
                              disabled={
                                updatingReservationId === reservation._id
                              }
                              onClick={() =>
                                updateReservationStatus(
                                  reservation._id,
                                  nextAction.next
                                )
                              }
                            >
                              {updatingReservationId === reservation._id
                                ? "Updating..."
                                : nextAction.label}
                            </button>
                          ) : (
                            <div className="order-complete">
                              <CircleCheck size={16} />
                              {reservation.status === "Completed"
                                ? "Reservation completed"
                                : reservation.status === "Seated"
                                  ? "Guest is seated"
                                  : reservation.status === "NoShow"
                                    ? "Guest did not arrive"
                                    : "Reservation closed"}
                            </div>
                          )}

                          {reservation.status === "Pending" ||
                          reservation.status === "Confirmed" ? (
                            <button
                              className="cancel-order-button"
                              disabled={
                                updatingReservationId === reservation._id
                              }
                              onClick={() =>
                                updateReservationStatus(
                                  reservation._id,
                                  "Cancelled"
                                )
                              }
                            >
                              Cancel
                            </button>
                          ) : null}

                          {reservation.status === "Confirmed" && (
                            <button
                              className="cancel-order-button"
                              disabled={
                                updatingReservationId === reservation._id
                              }
                              onClick={() =>
                                updateReservationStatus(
                                  reservation._id,
                                  "NoShow"
                                )
                              }
                            >
                              No-show
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          
          {activePage === "Inventory" && (
            <section className="panel inventory-panel">
              <div className="panel-heading">
                <div>
                  <h2>Inventory Management</h2>
                  <p>
                    {loadingInventory
                      ? "Loading inventory..."
                      : `${filteredInventoryItems.length} of ${inventoryItems.length} ingredients`}
                  </p>
                </div>

                <button
                  className="secondary-button"
                  onClick={loadInventory}
                  disabled={loadingInventory}
                >
                  <RefreshCw size={16} />
                  {loadingInventory ? "Refreshing..." : "Refresh stock"}
                </button>
              </div>

              {inventoryError && (
                <div className="notice notice-error">
                  <span>{inventoryError}</span>
                  <button
                    className="text-button"
                    onClick={() => setInventoryError("")}
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {inventoryNotice && (
                <div className="notice notice-success">
                  <CircleCheck size={16} />
                  <span>{inventoryNotice}</span>
                </div>
              )}

              <div className="inventory-summary-grid">
                <article className="inventory-summary-card">
                  <span>Active ingredients</span>
                  <strong>
                    {loadingInventory ? "…" : inventoryItems.length}
                  </strong>
                  <small>Tracked in your inventory</small>
                </article>

                <article className="inventory-summary-card">
                  <span>Low-stock items</span>
                  <strong className="inventory-warning-number">
                    {inventoryItems.filter(
                      (item) => item.currentStock <= item.reorderLevel
                    ).length}
                  </strong>
                  <small>At or below reorder level</small>
                </article>

                <article className="inventory-summary-card">
                  <span>Total stock value</span>
                  <strong>
                    {formatPrice(
                      inventoryItems.reduce(
                        (sum, item) =>
                          sum +
                          Number(
                            item.stockValue ??
                              item.currentStock * item.costPerUnit
                          ),
                        0
                      )
                    )}
                  </strong>
                  <small>Estimated value at recorded unit cost</small>
                </article>
              </div>

              <div className="inventory-toolbar">
                <label className="inventory-search">
                  <Search size={17} />
                  <input
                    type="search"
                    value={inventorySearch}
                    placeholder="Search ingredients, SKU or supplier..."
                    onChange={(event) =>
                      setInventorySearch(event.target.value)
                    }
                  />
                </label>

                <label className="inventory-low-filter">
                  <input
                    type="checkbox"
                    checked={showLowStockOnly}
                    onChange={(event) =>
                      setShowLowStockOnly(event.target.checked)
                    }
                  />
                  Low stock only
                </label>
              </div>

              {loadingInventory ? (
                <div className="empty-state">
                  Loading restaurant inventory...
                </div>
              ) : inventoryItems.length === 0 ? (
                <div className="empty-state">
                  <Package size={30} />
                  <strong>No inventory records yet</strong>
                  <span>Inventory items will appear here after they are added.</span>
                </div>
              ) : filteredInventoryItems.length === 0 ? (
                <div className="empty-state">
                  No ingredients match your search or filter.
                </div>
              ) : (
                <div className="inventory-grid">
                  {filteredInventoryItems.map((item) => {
                    const isLowStock =
                      item.currentStock <= item.reorderLevel;

                    const stockPercent =
                      item.reorderLevel > 0
                        ? Math.min(
                            100,
                            (item.currentStock / (item.reorderLevel * 3)) * 100
                          )
                        : 100;

                    return (
                      <article
                        className="inventory-card"
                        key={item._id}
                      >
                        <div className="inventory-card-heading">
                          <div className="inventory-item-icon">
                            <Package size={20} />
                          </div>

                          <span
                            className={`inventory-status ${
                              isLowStock
                                ? "inventory-status-low"
                                : "inventory-status-good"
                            }`}
                          >
                            {isLowStock ? "Low stock" : "In stock"}
                          </span>
                        </div>

                        <div className="inventory-item-title">
                          <h3>{item.name}</h3>
                          <span>
                            {item.category} · {item.sku}
                          </span>
                        </div>

                        <div className="inventory-quantity-row">
                          <div>
                            <span>Current stock</span>
                            <strong>
                              {Number(item.currentStock).toLocaleString(
                                "en-IN"
                              )}{" "}
                              {item.unit}
                            </strong>
                          </div>

                          <div className="inventory-reorder">
                            <span>Reorder at</span>
                            <strong>
                              {Number(item.reorderLevel).toLocaleString(
                                "en-IN"
                              )}{" "}
                              {item.unit}
                            </strong>
                          </div>
                        </div>

                        <div className="inventory-stock-track">
                          <div
                            className={`inventory-stock-fill ${
                              isLowStock ? "inventory-stock-fill-low" : ""
                            }`}
                            style={{ width: `${stockPercent}%` }}
                          />
                        </div>

                        <div className="inventory-item-meta">
                          <span>Unit cost</span>
                          <strong>
                            {formatPrice(item.costPerUnit)} / {item.unit}
                          </strong>
                        </div>

                        <div className="inventory-item-meta">
                          <span>Estimated stock value</span>
                          <strong>
                            {formatPrice(
                              item.stockValue ??
                                item.currentStock * item.costPerUnit
                            )}
                          </strong>
                        </div>

                        <div className="inventory-supplier">
                          <span>Supplier</span>
                          <strong>
                            {item.supplierName || "Not specified"}
                          </strong>
                        </div>

                        <label className="inventory-quantity-input">
                          <span>Quantity ({item.unit})</span>
                          <input
                            type="number"
                            min="0.000001"
                            step="any"
                            placeholder="Enter quantity"
                            value={stockQuantities[item._id] ?? ""}
                            onChange={(event) =>
                              setStockQuantities((current) => ({
                                ...current,
                                [item._id]: event.target.value,
                              }))
                            }
                          />
                        </label>

                        <div className="inventory-actions">
                          <button
                            className="inventory-receive-button"
                            disabled={updatingInventoryId === item._id}
                            onClick={() =>
                              adjustInventoryStock(item, "receive")
                            }
                          >
                            {updatingInventoryId === item._id
                              ? "Updating..."
                              : "Receive stock"}
                          </button>

                          <button
                            className="inventory-consume-button"
                            disabled={updatingInventoryId === item._id}
                            onClick={() =>
                              adjustInventoryStock(item, "consume")
                            }
                          >
                            Consume
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              <div className="menu-admin-note">
                <Sparkles size={16} />
                <span>
                  Stock updates are saved to MongoDB. Automatic recipe-based
                  deductions from kitchen orders will be integrated separately.
                </span>
              </div>
            </section>
          )}

          
          {activePage === "Reports" && (
            <section className="panel reports-panel">
              <div className="panel-heading">
                <div>
                  <h2>Reports & Analytics</h2>
                  <p>
                    {reportsData?.generatedAt
                      ? `Last updated ${new Date(
                          reportsData.generatedAt
                        ).toLocaleString("en-IN")}`
                      : "Insights from your restaurant database"}
                  </p>
                </div>

                <button
                  className="secondary-button"
                  onClick={loadReports}
                  disabled={loadingReports}
                >
                  <RefreshCw size={16} />
                  {loadingReports ? "Refreshing..." : "Refresh reports"}
                </button>
              </div>

              {reportsError && (
                <div className="notice notice-error">
                  <span>{reportsError}</span>
                  <button
                    className="text-button"
                    onClick={() => setReportsError("")}
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {loadingReports && !reportsData ? (
                <div className="empty-state">
                  Loading restaurant analytics...
                </div>
              ) : reportsData ? (
                <>
                  <div className="reports-summary-grid">
                    <article className="reports-summary-card">
                      <div className="reports-summary-icon">
                        <BarChart3 size={19} />
                      </div>
                      <span>Paid revenue today</span>
                      <strong>
                        {formatPrice(
                          reportsData.overview.paidRevenueToday
                        )}
                      </strong>
                      <small>
                        {reportsData.overview.paidOrdersToday} paid orders
                      </small>
                    </article>

                    <article className="reports-summary-card">
                      <div className="reports-summary-icon">
                        <ClipboardList size={19} />
                      </div>
                      <span>Orders today</span>
                      <strong>
                        {reportsData.overview.ordersToday}
                      </strong>
                      <small>
                        {reportsData.overview.activeOrders} active orders
                      </small>
                    </article>

                    <article className="reports-summary-card">
                      <div className="reports-summary-icon">
                        <CalendarDays size={19} />
                      </div>
                      <span>Reservations today</span>
                      <strong>
                        {reportsData.overview.reservationsToday}
                      </strong>
                      <small>Non-cancelled bookings</small>
                    </article>

                    <article className="reports-summary-card">
                      <div className="reports-summary-icon">
                        <Package size={19} />
                      </div>
                      <span>Inventory valuation</span>
                      <strong>
                        {formatPrice(
                          reportsData.overview.inventoryValue
                        )}
                      </strong>
                      <small>
                        {reportsData.overview.lowStockItems} low-stock items
                      </small>
                    </article>
                  </div>

                  <div className="reports-detail-grid">
                    <article className="panel reports-detail-card">
                      <div className="panel-heading">
                        <div>
                          <h2>Revenue overview</h2>
                          <p>Recorded payments only</p>
                        </div>
                        <span className="reports-detail-icon">
                          <BarChart3 size={19} />
                        </span>
                      </div>

                      <div className="revenue-highlight">
                        <span>Today's paid revenue</span>
                        <strong>
                          {formatPrice(
                            reportsData.overview.paidRevenueToday
                          )}
                        </strong>
                      </div>

                      <div className="reports-data-row">
                        <span>Paid orders today</span>
                        <strong>
                          {reportsData.overview.paidOrdersToday}
                        </strong>
                      </div>

                      <div className="reports-data-row">
                        <span>This month's paid revenue</span>
                        <strong>
                          {formatPrice(
                            reportsData.overview.paidRevenueThisMonth
                          )}
                        </strong>
                      </div>

                      <div className="reports-data-row">
                        <span>Paid orders this month</span>
                        <strong>
                          {reportsData.overview.paidOrdersThisMonth}
                        </strong>
                      </div>

                      <p className="reports-footnote">
                        Only orders marked Paid are included. Payment
                        gateway integration has not been added yet.
                      </p>
                    </article>

                    <article className="panel reports-detail-card">
                      <div className="panel-heading">
                        <div>
                          <h2>Popular dishes</h2>
                          <p>Most ordered items this month</p>
                        </div>
                        <span className="reports-detail-icon">
                          <UtensilsCrossed size={19} />
                        </span>
                      </div>

                      {reportsData.popularItems?.length ? (
                        <div className="popular-items-list">
                          {reportsData.popularItems.map((item, index) => {
                            const maxQuantity = Math.max(
                              1,
                              ...reportsData.popularItems.map(
                                (dish) => dish.quantitySold
                              )
                            );

                            return (
                              <div
                                className="popular-item"
                                key={item.name}
                              >
                                <div className="popular-item-top">
                                  <span className="popular-rank">
                                    {String(index + 1).padStart(2, "0")}
                                  </span>

                                  <div className="popular-item-name">
                                    <strong>{item.name}</strong>
                                    <small>
                                      {item.quantitySold} portions ordered
                                    </small>
                                  </div>

                                  <strong className="popular-item-count">
                                    {item.quantitySold}
                                  </strong>
                                </div>

                                <div className="popular-track">
                                  <div
                                    className="popular-fill"
                                    style={{
                                      width: `${
                                        (item.quantitySold / maxQuantity) *
                                        100
                                      }%`,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="empty-state">
                          No dish activity recorded this month yet.
                        </div>
                      )}
                    </article>
                  </div>

                  <div className="reports-operations">
                    <div className="reports-operations-heading">
                      <div>
                        <h2>Operations snapshot</h2>
                        <p>Current restaurant performance</p>
                      </div>
                    </div>

                    <div className="reports-operation-row">
                      <span>Available menu items</span>
                      <strong>
                        {reportsData.overview.totalMenuItems}
                      </strong>
                    </div>

                    <div className="reports-operation-row">
                      <span>Orders served today</span>
                      <strong>
                        {reportsData.overview.servedToday}
                      </strong>
                    </div>

                    <div className="reports-operation-row">
                      <span>Active kitchen orders</span>
                      <strong>
                        {reportsData.overview.activeOrders}
                      </strong>
                    </div>

                    <div className="reports-operation-row">
                      <span>Ingredients requiring reorder</span>
                      <strong
                        className={
                          reportsData.overview.lowStockItems > 0
                            ? "reports-warning-value"
                            : ""
                        }
                      >
                        {reportsData.overview.lowStockItems}
                      </strong>
                    </div>
                  </div>

                  <div className="menu-admin-note">
                    <Sparkles size={16} />
                    <span>
                      Reports are calculated from the current database
                      records. Refresh to fetch the latest figures.
                    </span>
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  Reports are not available yet. Try refreshing.
                  <button className="text-button" onClick={loadReports}>
                    Load reports
                  </button>
                </div>
              )}
            </section>
          )}



          {activePage !== "Dashboard" && activePage !== "Menu" && activePage !== "Orders" && activePage !== "Tables" &&
          activePage !== "Inventory" &&  activePage !== "Reports" &&  (
            <section className="module-panel panel">
              <div className="module-illustration">
                {activePage === "Orders" && <ClipboardList size={34} />}
                {activePage === "Tables" && <CalendarDays size={34} />}
                {activePage === "Inventory" && <Package size={34} />}
                {activePage === "Reports" && <BarChart3 size={34} />}
                {activePage === "Settings" && <Settings size={34} />}
              </div>
              <span className="eyebrow">DINEFLOW WORKSPACE</span>
              <h2>{currentPage.title}</h2>
              <p>{currentPage.subtitle}</p>
              <div className="module-status">
                <Clock3 size={17} />
                This module has not been connected yet.
              </div>
              <button className="primary-button" onClick={() => navigate("Menu")}>
                Explore live menu <ArrowRight size={16} />
              </button>
            </section>
          )}

          <footer className="page-footer">
            <div className="footer-brand">
              <UtensilsCrossed size={15} />
              <span>DINEFLOW</span>
              <span className="footer-dot">·</span>
              <span>THE ART OF DINING</span>
            </div>
            <span>Restaurant management workspace</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
