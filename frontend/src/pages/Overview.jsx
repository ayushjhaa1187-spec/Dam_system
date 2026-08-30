import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  ShieldAlert,
  Waves,
  TrendingUp,
  MapPin,
  Clock,
  Play,
  Pause,
  ArrowRight,
  Activity,
  Layers,
  Compass,
  AlertTriangle,
  Building2,
  Users,
  IndianRupee,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import MetricCard from '../components/common/MetricCard';
import { createBasemapLayer } from '../utils/mapTiles';