
import { useEffect, useState } from 'react';

const API = 'http://localhost:5000/api';
const groups = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

function App() {
  const [page, setPage] = useState('home');
  const [inventory, setInventory] = useState([]);
  const [donors, setDonors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [dashboard, setDashboard] = useState({
    total: 0,
    Pending: 0,
    Approved: 0,
    Rejected: 0,
    Completed: 0
  });

  const [search, setSearch] = useState({ bloodGroup: '', city: '' });
  const [notice, setNotice] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [token, setToken] = useState(localStorage.getItem('bloodBankToken') || '');
  const [user, setUser] = useState(null);

  const authHeaders = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  async function loadInventory() {
    try {
      const response = await fetch(`${API}/inventory`);
      if (!response.ok) throw new Error();
      setInventory(await response.json());
    } catch {
      setNotice('Cannot connect to server. Start the backend and check MySQL.');
    }
  }

  async function loadRequests() {
    if (!token) return;

    try {
      const response = await fetch(`${API}/requests`, {
        headers: authHeaders
      });

      if (!response.ok) throw new Error('Unable to load blood requests.');

      setRequests(await response.json());
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function loadMyRequests() {
    if (!token) return;

    try {
      const response = await fetch(`${API}/requests/mine`, {
        headers: authHeaders
      });

      if (!response.ok) throw new Error('Unable to load your requests.');

      setMyRequests(await response.json());
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function updateRequestStatus(id, status) {
    try {
      const response = await fetch(`${API}/requests/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({ status })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Status update failed.');
      }

      setNotice('Request status updated successfully.');
      await loadRequests();
      await loadMyRequests();
    } catch (error) {
      setNotice(error.message);
    }
  }

  useEffect(() => {
    loadInventory();
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setRequests([]);
      setMyRequests([]);
      return;
    }

    loadRequests();
    loadMyRequests();

    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async response => {
        if (!response.ok) {
          throw new Error('Session expired. Please log in again.');
        }
        return response.json();
      })
      .then(setUser)
      .catch(error => {
        logout(false);
        setNotice(error.message);
      });
  }, [token]);

  useEffect(() => {
    setDashboard({
      total: requests.length,
      Pending: requests.filter(r => r.status === 'Pending').length,
      Approved: requests.filter(r => r.status === 'Approved').length,
      Rejected: requests.filter(r => r.status === 'Rejected').length,
      Completed: requests.filter(r => r.status === 'Completed').length
    });
  }, [requests]);

  function logout(showMessage = true) {
    localStorage.removeItem('bloodBankToken');
    setToken('');
    setUser(null);
    setPage('home');

    if (showMessage) {
      setNotice('You have been logged out.');
    }
  }

  function handleAuthSuccess(data) {
    localStorage.setItem('bloodBankToken', data.token);
    setToken(data.token);
    setUser(data.user);
    setPage('home');
    setNotice(data.message);
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const isRegister = authMode === 'register';

    const body = isRegister
      ? {
          fullName: formData.get('fullName'),
          email: formData.get('email'),
          password: formData.get('password')
        }
      : {
          email: formData.get('email'),
          password: formData.get('password')
        };

    try {
      const response = await fetch(
        `${API}/auth/${isRegister ? 'register' : 'login'}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed.');
      }

      handleAuthSuccess(data);
      form.reset();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function searchDonors(event) {
    event.preventDefault();

    const params = new URLSearchParams();

    if (search.bloodGroup) params.set('bloodGroup', search.bloodGroup);
    if (search.city) params.set('city', search.city);

    try {
      const response = await fetch(`${API}/donors?${params}`);

      if (!response.ok) throw new Error();

      setDonors(await response.json());
      setNotice('');
    } catch {
      setNotice('Unable to search donors. Check the backend connection.');
    }
  }

  async function submitForm(event, endpoint, makeBody, successMessage) {
    event.preventDefault();

    const form = event.currentTarget;
    const body = makeBody(new FormData(form));

    try {
      const response = await fetch(`${API}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Request failed');
      }

      setNotice(successMessage);
      form.reset();

      if (endpoint === 'inventory') {
        loadInventory();
      }

      if (endpoint === 'requests') {
        await loadRequests();
        await loadMyRequests();
      }
    } catch (error) {
      setNotice(error.message || 'Could not submit form.');
    }
  }

  const donorSubmit = e => submitForm(
    e,
    'donors',
    f => ({
      fullName: f.get('fullName'),
      age: f.get('age'),
      gender: f.get('gender'),
      bloodGroup: f.get('bloodGroup'),
      phone: f.get('phone'),
      email: f.get('email'),
      city: f.get('city'),
      lastDonationDate: f.get('lastDonationDate') || null
    }),
    'Thank you! Donor registration completed.'
  );

  const requestSubmit = e => submitForm(
    e,
    'requests',
    f => ({
      patientName: f.get('patientName'),
      bloodGroup: f.get('bloodGroup'),
      units: f.get('units'),
      hospital: f.get('hospital'),
      city: f.get('city'),
      contactPhone: f.get('contactPhone'),
      urgency: f.get('urgency')
    }),
    'Blood request submitted successfully.'
  );

  const inventorySubmit = e => submitForm(
    e,
    'inventory',
    f => ({
      bloodGroup: f.get('bloodGroup'),
      units: Number(f.get('units'))
    }),
    'Inventory updated.'
  );

  return (
    <div>
      <header className="topbar">
        <a
          className="brand"
          href="#"
          onClick={e => {
            e.preventDefault();
            setPage('home');
          }}
        >
          <span>♥</span> LifeDrop
        </a>

        <nav>
          {['home', 'donor', 'search', 'request'].map(item => (
            <button
              key={item}
              className={page === item ? 'active' : ''}
              onClick={() => setPage(item)}
            >
              {{
                home: 'Home',
                donor: 'Become a Donor',
                search: 'Find Donors',
                request: 'Blood Request'
              }[item]}
            </button>
          ))}

          {user && (
            <>
              <button
                className={page === 'allRequests' ? 'active' : ''}
                onClick={() => {
                  setPage('allRequests');
                  loadRequests();
                }}
              >
                All Requests
              </button>

              <button
                className={page === 'myRequests' ? 'active' : ''}
                onClick={() => {
                  setPage('myRequests');
                  loadMyRequests();
                }}
              >
                My Requests
              </button>
            </>
          )}

          {user?.role === 'admin' && (
            <button
              className={page === 'admin' ? 'active' : ''}
              onClick={() => {
                setPage('admin');
                loadRequests();
              }}
            >
              Admin Panel
            </button>
          )}

          {!user ? (
            <button
              className={page === 'auth' ? 'active' : ''}
              onClick={() => {
                setAuthMode('login');
                setPage('auth');
              }}
            >
              Login / Register
            </button>
          ) : (
            <button onClick={() => logout()}>
              Logout ({user.fullName})
            </button>
          )}
        </nav>
      </header>

      <main>
        {notice && (
          <div className="notice">
            <span>{notice}</span>
            <button onClick={() => setNotice('')}>×</button>
          </div>
        )}

        {page === 'auth' && (
          <section className="form-card auth-card">
            <p className="eyebrow">WELCOME TO LIFEDROP</p>
            <h2>
              {authMode === 'login'
                ? 'Login to your account'
                : 'Create your account'}
            </h2>

            <p className="muted">
              {authMode === 'login'
                ? 'Enter your email and password to continue.'
                : 'Register as a user to get started.'}
            </p>

            <form onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <Field label="Full name">
                  <input name="fullName" required maxLength="100" />
                </Field>
              )}

              <Field label="Email address">
                <input name="email" type="email" required />
              </Field>

              <Field label="Password">
                <input
                  name="password"
                  type="password"
                  minLength="8"
                  required
                  autoComplete={
                    authMode === 'login'
                      ? 'current-password'
                      : 'new-password'
                  }
                />
              </Field>

              <button className="primary auth-submit">
                {authMode === 'login' ? 'Login' : 'Create account'}
              </button>
            </form>

            <p className="auth-switch">
              {authMode === 'login'
                ? "Don't have an account?"
                : 'Already registered?'}

              <button
                onClick={() =>
                  setAuthMode(
                    authMode === 'login' ? 'register' : 'login'
                  )
                }
              >
                {authMode === 'login' ? 'Register' : 'Login'}
              </button>
            </p>

            <p className="privacy-note">
              Public registration creates a standard user account.
              Admin accounts must be created manually by the system owner.
            </p>
          </section>
        )}

        {page === 'home' && (
          <>
            <section className="hero">
              <div className="hero-copy">
                <p className="eyebrow">GIVE BLOOD. SHARE LIFE.</p>
                <h1>
                  One donation can<br />
                  <em>save three lives.</em>
                </h1>
                <p className="lead">
                  Connect with blood donors and help patients find the
                  support they need.
                </p>

                <div className="hero-actions">
                  <button
                    className="primary"
                    onClick={() => setPage('donor')}
                  >
                    Become a donor
                  </button>

                  <button
                    className="secondary"
                    onClick={() => setPage('request')}
                  >
                    Request blood
                  </button>
                </div>
              </div>

              <div className="hero-art">
                <div className="drop">♥</div>
                <div className="art-note">
                  Every drop<br />
                  makes a difference.
                </div>
              </div>
            </section>

            <section className="section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">LIVE OVERVIEW</p>
                  <h2>Blood availability</h2>
                </div>
                <button className="text-button" onClick={loadInventory}>
                  ↻ Refresh
                </button>
              </div>

              <Inventory inventory={inventory} />
            </section>

            <section className="info-grid">
              <Info
                icon="01"
                title="Register"
                text="Join our donor directory by sharing your basic contact details."
              />
              <Info
                icon="02"
                title="Search"
                text="Find registered donors by blood group and city."
              />
              <Info
                icon="03"
                title="Request"
                text="Send a blood request to the blood bank team."
              />
            </section>
          </>
        )}

        {page === 'donor' && (
          <section className="form-card">
            <p className="eyebrow">MAKE A DIFFERENCE</p>
            <h2>Donor registration</h2>
            <p className="muted">
              Fill in your details to join the donor directory.
            </p>

            <form onSubmit={donorSubmit}>
              <div className="form-grid">
                <Field label="Full name">
                  <input name="fullName" required maxLength="100" />
                </Field>

                <Field label="Age">
                  <input name="age" type="number" min="18" max="65" required />
                </Field>

                <Field label="Gender">
                  <select name="gender">
                    <option value="">Prefer not to say</option>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                  </select>
                </Field>

                <Field label="Blood group">
                  <select name="bloodGroup" required>
                    <option value="">Select group</option>
                    {groups.map(g => <option key={g}>{g}</option>)}
                  </select>
                </Field>

                <Field label="Phone number">
                  <input name="phone" type="tel" required maxLength="20" />
                </Field>

                <Field label="Email (optional)">
                  <input name="email" type="email" />
                </Field>

                <Field label="City">
                  <input name="city" required />
                </Field>

                <Field label="Last donation date (optional)">
                  <input name="lastDonationDate" type="date" />
                </Field>
              </div>

              <button className="primary" type="submit">
                Register as donor
              </button>
            </form>
          </section>
        )}

        {page === 'search' && (
          <section className="form-card">
            <p className="eyebrow">FIND SUPPORT</p>
            <h2>Find blood donors</h2>
            <p className="muted">
              Search the registered donor directory.
            </p>

            <form onSubmit={searchDonors}>
              <div className="form-grid">
                <Field label="Blood group">
                  <select
                    value={search.bloodGroup}
                    onChange={e =>
                      setSearch({ ...search, bloodGroup: e.target.value })
                    }
                  >
                    <option value="">All groups</option>
                    {groups.map(g => <option key={g}>{g}</option>)}
                  </select>
                </Field>

                <Field label="City">
                  <input
                    value={search.city}
                    onChange={e =>
                      setSearch({ ...search, city: e.target.value })
                    }
                    placeholder="e.g. Bengaluru"
                  />
                </Field>
              </div>

              <button className="primary">Search donors</button>
            </form>

            <div className="results">
              {donors.map(d => (
                <div className="donor-row" key={d.id}>
                  <div className="blood-badge">{d.blood_group}</div>
                  <div>
                    <b>{d.full_name}</b>
                    <small>{d.city} · Age {d.age}</small>
                  </div>
                  <span className="available">Available</span>
                </div>
              ))}

              {donors.length === 0 && (
                <p className="muted">
                  No results yet. Enter filters and select Search donors.
                </p>
              )}
            </div>

            <p className="privacy-note">
              For privacy, donor phone numbers are not displayed publicly.
              Contact the blood bank to coordinate.
            </p>
          </section>
        )}

        {page === 'request' && (
          <section className="form-card">
            <p className="eyebrow">WE ARE HERE TO HELP</p>
            <h2>Request blood</h2>
            <p className="muted">
              Submit a request for the blood bank team to review.
            </p>

            <form onSubmit={requestSubmit}>
              <div className="form-grid">
                <Field label="Patient name">
                  <input name="patientName" required />
                </Field>

                <Field label="Blood group">
                  <select name="bloodGroup" required>
                    <option value="">Select group</option>
                    {groups.map(g => <option key={g}>{g}</option>)}
                  </select>
                </Field>

                <Field label="Units required">
                  <input name="units" type="number" min="1" max="50" required />
                </Field>

                <Field label="Hospital">
                  <input name="hospital" required />
                </Field>

                <Field label="City">
                  <input name="city" required />
                </Field>

                <Field label="Contact phone">
                  <input name="contactPhone" type="tel" required />
                </Field>

                <Field label="Urgency">
                  <select name="urgency">
                    <option>Normal</option>
                    <option>Urgent</option>
                    <option>Emergency</option>
                  </select>
                </Field>
              </div>

              <button className="primary">Submit request</button>
            </form>
          </section>
        )}

        {page === 'allRequests' && user && (
          <section className="form-card">
            <p className="eyebrow">COMMUNITY BLOOD REQUESTS</p>
            <h2>All Blood Requests</h2>
            <button className="secondary" onClick={loadRequests}>
              Refresh
            </button>
            <RequestList requests={requests} />
          </section>
        )}

        {page === 'myRequests' && user && (
          <section className="form-card">
            <p className="eyebrow">YOUR ACTIVITY</p>
            <h2>My Blood Requests</h2>
            <button className="secondary" onClick={loadMyRequests}>
              Refresh
            </button>
            <RequestList requests={myRequests} />
          </section>
        )}

        {page === 'admin' && user?.role === 'admin' && (
          <section className="form-card">
            <p className="eyebrow">ADMINISTRATOR</p>
            <h2>Admin Dashboard</h2>

            <div className="stock-grid">
              {[
                ['Total Requests', dashboard.total],
                ['Pending', dashboard.Pending],
                ['Approved', dashboard.Approved],
                ['Rejected', dashboard.Rejected],
                ['Completed', dashboard.Completed]
              ].map(([label, count]) => (
                <div className="stock-card" key={label}>
                  <span>{label}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>

            <h3 className="subheading">Manage Blood Requests</h3>
            <RequestList
              requests={requests}
              isAdmin={true}
              onStatusChange={updateRequestStatus}
            />

            <h2>Manage inventory</h2>
            <p className="muted">
              Update the number of units available for a blood group.
            </p>

            <form onSubmit={inventorySubmit}>
              <div className="form-grid">
                <Field label="Blood group">
                  <select name="bloodGroup" required>
                    {groups.map(g => <option key={g}>{g}</option>)}
                  </select>
                </Field>

                <Field label="Units available">
                  <input
                    name="units"
                    type="number"
                    min="0"
                    step="1"
                    required
                  />
                </Field>
              </div>

              <button className="primary">Save inventory</button>
            </form>

            <h3 className="subheading">Current stock</h3>
            <Inventory inventory={inventory} />
          </section>
        )}
      </main>

      <footer>
        <b>♥ LifeDrop</b>
        <span>Online Blood Bank Management System · Student project</span>
      </footer>
    </div>
  );
}

function RequestList({ requests, isAdmin = false, onStatusChange }) {
  if (!requests.length) {
    return <p className="muted">No blood requests found.</p>;
  }

  return (
    <div className="results">
      {requests.map(request => (
        <div className="donor-row" key={request.id}>
          <div className="blood-badge">{request.bloodGroup}</div>

          <div>
            <b>{request.patientName}</b>
            <small>{request.hospital} · {request.city}</small>
            <small>
              {request.units} units · {request.urgency}
            </small>
            <small>Status: {request.status}</small>
            <small>Contact: {request.contactPhone}</small>
          </div>

          {isAdmin && (
            <select
              value={request.status}
              onChange={e =>
                onStatusChange(request.id, e.target.value)
              }
            >
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
              <option>Completed</option>
            </select>
          )}
        </div>
      ))}
    </div>
  );
}

function Inventory({ inventory }) {
  if (!inventory.length) {
    return (
      <p className="muted">
        Inventory is loading, or the database has no stock records yet.
      </p>
    );
  }

  return (
    <div className="stock-grid">
      {inventory.map(item => (
        <div className="stock-card" key={item.bloodGroup}>
          <span>{item.bloodGroup}</span>
          <strong>{item.units}</strong>
          <small>units</small>
        </div>
      ))}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Info({ icon, title, text }) {
  return (
    <article className="info-card">
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

export default App;
