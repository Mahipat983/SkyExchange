import React from 'react';
import { NavLink } from 'react-router-dom';
import Layout from '../../components/Layout';
import '../../styles/account.css';

function AccountLayout({ children, title }) {
  return (
    <Layout>
      <div className="account-container full-wrap">
        <aside className="account-sidebar">
          <div className="sidebar-header">My Account</div>
          <nav className="account-nav">
            <ul>
              <li>
                <NavLink to="/profile" className={({ isActive }) => (isActive ? 'active' : '')}>
                  My Profile
                </NavLink>
              </li>
              <li>
                <NavLink to="/balance-overview" className={({ isActive }) => (isActive ? 'active' : '')}>
                  Balance Overview
                </NavLink>
              </li>
              <li>
                <NavLink to="/statement" className={({ isActive }) => (isActive ? 'active' : '')}>
                  Account Statement
                </NavLink>
              </li>
              <li>
                <NavLink to="/offers" className={({ isActive }) => (isActive ? 'active' : '')}>
                  Offers
                </NavLink>
              </li>
              <li>
                <NavLink to="/bets" className={({ isActive }) => (isActive ? 'active' : '')}>
                  My Bets
                </NavLink>
              </li>

            </ul>
          </nav>
        </aside>

        <main className="account-main">
          {title && <div className="content-header">{title}</div>}
          <div className="content-body">
            {children}
          </div>
        </main>
      </div>
    </Layout>
  );
}

export default AccountLayout;
