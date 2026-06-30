"use client";



import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './admin.module.css';

interface Stats {
  galleryCount: number;
  userCount: number;
  totalImages: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    galleryCount: 0,
    userCount: 0,
    totalImages: 0,
  });

  useEffect(() => {
    // Fetch simple overview stats from backend (replace with real endpoint when ready)
    fetch('/api/admin/overview')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => console.warn('Admin overview endpoint not available yet'));
  }, []);

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Admin Dashboard</h1>
      <section className={styles.cards}>
        <Link href="/admin/galleries" className={styles.card}>
          <h2>Galleries</h2>
          <p>{stats.galleryCount} galleries</p>
        </Link>
        <Link href="/admin/users" className={styles.card}>
          <h2>Users</h2>
          <p>{stats.userCount} users</p>
        </Link>
        <Link href="/admin/analytics" className={styles.card}>
          <h2>Analytics</h2>
          <p>{stats.totalImages} images uploaded</p>
        </Link>
      </section>
    </main>
  );
};

export default AdminDashboard;
