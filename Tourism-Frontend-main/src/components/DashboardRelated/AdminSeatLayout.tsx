'use client'

import { useState, useEffect } from 'react';
import { 
  FaCouch, FaBed, FaChair, FaUser, FaWheelchair, 
  FaRestroom, FaEdit, FaSave,
  FaTimes, FaPlus, FaTrash, FaArrowUp, FaArrowDown, FaBus,
  FaLongArrowAltRight, FaShoppingCart, FaShoppingBag, FaBan,
  FaMinusCircle
} from 'react-icons/fa';
import { adminBusApi } from '@/src/api/admin-bus.api';
import styles from './AdminSeatLayout.module.css';

// Types
interface Seat {
  id: string;
  number: string;
  deck: 'lower' | 'upper';
  type: 'regular' | 'blocked' | 'driver' | 'wc';
  position: { row: number; col: number; side: 'left' | 'right' };
}

interface DeckConfig {
  name: 'lower' | 'upper';
  rows: number;
  seats: {
    left: Seat[];
    right: Seat[];
  };
}

interface BusLayout {
  _id: string;
  vehicle_no: string;
  bus_type: 'seater' | 'sleeper' | 'semi-sleeper';
  total_seats: number; // This should count ONLY regular seats
  total_capacity: number; // This counts all seats (including special ones)
  decks: DeckConfig[];
}

interface AdminSeatLayoutProps {
  busId?: string;
  onSave?: (layout: BusLayout) => void;
  readOnly?: boolean;
  tripInstanceId?: string;
  userView?: boolean;
  onSeatSelection?: (selectedSeats: string[]) => void;
}

// For user view - seat status from trip instance
interface SeatStatus {
  seatNumber: string;
  status: 'available' | 'booked' | 'selected';
}

export default function AdminSeatLayout({ 
  busId, 
  onSave, 
  readOnly = false, 
  tripInstanceId,
  userView = false,
  onSeatSelection
}: AdminSeatLayoutProps) {
  const [layout, setLayout] = useState<BusLayout | null>(null);
  const [activeDeck, setActiveDeck] = useState<'lower' | 'upper'>('lower');
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // For user view - seat statuses from trip instance
  const [seatStatuses, setSeatStatuses] = useState<Map<string, 'available' | 'booked' | 'selected'>>(new Map());
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  useEffect(() => {
    if (busId) {
      loadBusLayout();
    } else {
      createDefaultLayout();
    }
  }, [busId]);

  // Load seat availability if in user view with trip instance
  useEffect(() => {
    if (userView && tripInstanceId && layout) {
      loadSeatAvailability();
    }
  }, [userView, tripInstanceId, layout]);

  // Notify parent of selected seats
  useEffect(() => {
    if (userView && onSeatSelection) {
      onSeatSelection(selectedSeats);
    }
  }, [selectedSeats, userView, onSeatSelection]);

  // Recalculate total seats whenever layout changes (but don't save)
  useEffect(() => {
    if (layout) {
      updateTotalSeats();
    }
  }, [layout?.decks[0]?.seats]);

  const updateTotalSeats = () => {
    if (!layout) return;
    
    const allSeats = [...layout.decks[0].seats.left, ...layout.decks[0].seats.right];
    const regularSeats = allSeats.filter(s => s.type === 'regular').length;
    const totalCapacity = allSeats.length;
    
    if (layout.total_seats !== regularSeats || layout.total_capacity !== totalCapacity) {
      setLayout(prev => prev ? {
        ...prev,
        total_seats: regularSeats,
        total_capacity: totalCapacity
      } : null);
      
      setHasUnsavedChanges(true);
    }
  };

  const loadBusLayout = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading bus layout for busId:', busId);
      
      const response = await adminBusApi.getBus(busId!);
      
      if (!response || !response.bus) {
        throw new Error('Bus not found');
      }
      
      const busData = response.bus;
      console.log('Bus data loaded:', busData);
      
      // If bus has seat_layout, use it
      if (busData.seat_layout && Array.isArray(busData.seat_layout) && busData.seat_layout.length > 0) {
        console.log('Parsing existing layout');
        parseLayoutFromBackend(busData);
      } else {
        console.log('Creating default layout');
        createDefaultLayout();
      }
    } catch (error: any) {
      console.error('Error loading bus layout:', error);
      setError(error.message || 'Failed to load bus layout');
      createDefaultLayout();
    } finally {
      setLoading(false);
    }
  };

  const parseLayoutFromBackend = (busData: any) => {
    try {
      const seatLayout = busData.seat_layout;
      const vehicleNo = busData.vehicle_no;
      
      if (Array.isArray(seatLayout) && seatLayout.length > 0) {
        const leftSeats: Seat[] = [];
        const rightSeats: Seat[] = [];
        
        seatLayout.forEach((row: string[], rowIndex: number) => {
          row.forEach((seatData: string, colIndex: number) => {
            if (!seatData) return;
            
            const [seatNumber, seatType] = seatData.split(':');
            const type = (seatType as 'regular' | 'blocked' | 'driver' | 'wc') || 'regular';
            const side = colIndex < 2 ? 'left' : 'right';
            
            const seat: Seat = {
              id: `lower-${side}-${seatNumber}`,
              number: seatNumber,
              deck: 'lower',
              type,
              position: { 
                row: rowIndex, 
                col: colIndex, 
                side 
              }
            };
            
            if (side === 'left') {
              leftSeats.push(seat);
            } else {
              rightSeats.push(seat);
            }
          });
        });
        
        leftSeats.sort((a, b) => a.position.row - b.position.row || a.position.col - b.position.col);
        rightSeats.sort((a, b) => a.position.row - b.position.row || a.position.col - b.position.col);
        
        const regularSeats = [...leftSeats, ...rightSeats].filter(s => s.type === 'regular').length;
        const totalCapacity = leftSeats.length + rightSeats.length;
        
        setLayout({
          _id: busData._id,
          vehicle_no: vehicleNo,
          bus_type: busData.bus_type,
          total_seats: regularSeats,
          total_capacity: totalCapacity,
          decks: [
            { 
              name: 'lower', 
              rows: seatLayout.length, 
              seats: { left: leftSeats, right: rightSeats }
            },
            { 
              name: 'upper', 
              rows: 0, 
              seats: { left: [], right: [] }
            }
          ]
        });
        
        setHasUnsavedChanges(false);
      } else {
        createDefaultLayout();
      }
    } catch (error) {
      console.error('Error parsing layout:', error);
      createDefaultLayout();
    }
  };

  const saveLayoutToBackend = async () => {
    if (!layout || !busId) return false;
    
    setSaving(true);
    try {
      const response = await adminBusApi.getBus(busId);
      const vehicleNo = response.bus.vehicle_no;
      
      const allSeats = [...layout.decks[0].seats.left, ...layout.decks[0].seats.right];
      const rows = layout.decks[0].rows;
      const cols = 4;
      
      const seatLayout2D: string[][] = Array(rows).fill(null).map(() => Array(cols).fill(''));
      
      allSeats.forEach(seat => {
        const row = seat.position.row;
        const col = seat.position.col;
        
        if (seat.type === 'regular') {
          seatLayout2D[row][col] = seat.number;
        } else {
          seatLayout2D[row][col] = `${seat.number}:${seat.type}`;
        }
      });
      
      await adminBusApi.updateBus(vehicleNo, {
        seat_layout: seatLayout2D,
        total_seats: layout.total_seats // Only regular seats count
      });
      
      if (onSave) {
        onSave(layout);
      }
      
      setHasUnsavedChanges(false);
      return true;
    } catch (error) {
      console.error('Error saving layout to backend:', error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const loadSeatAvailability = async () => {
    try {
      const response = await adminBusApi.getTripInstance(tripInstanceId!);
      const tripData = response.instance;
      
      const statusMap = new Map<string, 'available' | 'booked' | 'selected'>();
      
      if (layout) {
        const allSeats = [...layout.decks[0].seats.left, ...layout.decks[0].seats.right];
        allSeats.forEach(seat => {
          if (seat.type === 'regular') {
            statusMap.set(seat.number, 'available');
          }
        });
      }
      
      if (tripData.booked_seats && Array.isArray(tripData.booked_seats)) {
        tripData.booked_seats.forEach((seatNumber: string) => {
          statusMap.set(seatNumber, 'booked');
        });
      }
      
      setSeatStatuses(statusMap);
    } catch (error) {
      console.error('Error loading seat availability:', error);
    }
  };

  const createDefaultLayout = () => {
    const totalSeats = 40;
    const vehicleNo = 'BUS-' + (busId?.slice(-4) || 'NEW');
    const newLayout = createLayoutObject(vehicleNo, totalSeats);
    setLayout(newLayout);
    setHasUnsavedChanges(true);
  };

  const createLayoutObject = (vehicleNo: string, totalSeats: number): BusLayout => {
    const seatsPerRow = 4;
    const rows = Math.ceil(totalSeats / seatsPerRow);
    
    const leftSeats: Seat[] = [];
    const rightSeats: Seat[] = [];
    
    let seatCounter = 0;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < 2; col++) {
        if (seatCounter >= totalSeats) break;
        
        const seatNumber = `${String.fromCharCode(65 + row)}${col + 1}`;
        
        leftSeats.push({
          id: `lower-left-${seatNumber}`,
          number: seatNumber,
          deck: 'lower',
          type: 'regular',
          position: { row, col, side: 'left' }
        });
        
        seatCounter++;
      }
      
      for (let col = 0; col < 2; col++) {
        if (seatCounter >= totalSeats) break;
        
        const seatNumber = `${String.fromCharCode(65 + row)}${col + 3}`;
        
        rightSeats.push({
          id: `lower-right-${seatNumber}`,
          number: seatNumber,
          deck: 'lower',
          type: 'regular',
          position: { row, col: col + 2, side: 'right' }
        });
        
        seatCounter++;
      }
    }

    return {
      _id: busId || 'new',
      vehicle_no: vehicleNo,
      bus_type: 'seater',
      total_seats: totalSeats,
      total_capacity: totalSeats,
      decks: [
        { 
          name: 'lower', 
          rows, 
          seats: { left: leftSeats, right: rightSeats }
        },
        { 
          name: 'upper', 
          rows: 0, 
          seats: { left: [], right: [] }
        }
      ]
    };
  };

  const getSeatIcon = (seat: Seat, status?: string) => {
    if (!userView) {
      switch (seat.type) {
        case 'driver':
          return <FaUser className={styles.driverIcon} />;
        case 'wc':
          return <FaRestroom className={styles.wcIcon} />;
        case 'blocked':
          return <FaBan className={styles.blockedIcon} />;
        default:
          return <FaChair className={styles.regularIcon} />;
      }
    }
    
    if (seat.type === 'regular') {
      switch (status) {
        case 'booked':
          return <FaChair className={styles.bookedIcon} />;
        case 'selected':
          return <FaChair className={styles.selectedIcon} />;
        default:
          return <FaChair className={styles.availableIcon} />;
      }
    }
    
    return null;
  };

  const getSeatColor = (seat: Seat, status?: string) => {
    if (!userView) {
      switch (seat.type) {
        case 'driver': return '#8b5cf6';
        case 'wc': return '#6b7280';
        case 'blocked': return '#9ca3af';
        default: return '#94a3b8';
      }
    }
    
    if (seat.type === 'regular') {
      switch (status) {
        case 'booked': return '#ef4444';
        case 'selected': return '#3b82f6';
        default: return '#10b981';
      }
    }
    
    return 'transparent';
  };

  const handleSeatClick = (seat: Seat) => {
    if (userView) {
      if (seat.type !== 'regular') return;
      
      const currentStatus = seatStatuses.get(seat.number) || 'available';
      
      if (currentStatus === 'available') {
        const newStatuses = new Map(seatStatuses);
        newStatuses.set(seat.number, 'selected');
        setSeatStatuses(newStatuses);
        setSelectedSeats(prev => [...prev, seat.number]);
      } else if (currentStatus === 'selected') {
        const newStatuses = new Map(seatStatuses);
        newStatuses.set(seat.number, 'available');
        setSeatStatuses(newStatuses);
        setSelectedSeats(prev => prev.filter(s => s !== seat.number));
      }
      return;
    }
    
    if (readOnly || !editMode) return;
    setSelectedSeat(seat);
  };

  const handleTypeChange = async (seat: Seat, type: Seat['type']) => {
    if (!layout) return;
    
    const updatedLayout = { ...layout };
    const deck = updatedLayout.decks.find(d => d.name === seat.deck);
    if (!deck) return;
    
    const seatArray = seat.position.side === 'left' ? deck.seats.left : deck.seats.right;
    const seatIndex = seatArray.findIndex(s => s.id === seat.id);
    if (seatIndex === -1) return;
    
    const updatedSeatArray = [...seatArray];
    updatedSeatArray[seatIndex].type = type;
    
    if (seat.position.side === 'left') {
      deck.seats.left = updatedSeatArray;
    } else {
      deck.seats.right = updatedSeatArray;
    }
    
    setLayout(updatedLayout);
    setSelectedSeat(null);
    
    // Don't auto-save, just mark as unsaved
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!hasUnsavedChanges) {
      setEditMode(false);
      return;
    }
    
    const success = await saveLayoutToBackend();
    if (success) {
      setEditMode(false);
    }
  };

  const handleCancelEdit = () => {
    // Reload the layout from backend to discard changes
    loadBusLayout();
    setEditMode(false);
    setSelectedSeat(null);
    setHasUnsavedChanges(false);
  };

  const addRow = () => {
    if (!layout) return;
    
    const updatedLayout = { ...layout };
    const deck = updatedLayout.decks[0];
    if (!deck) return;
    
    const newRow = deck.rows;
    
    for (let col = 0; col < 2; col++) {
      const seatNumber = `${String.fromCharCode(65 + newRow)}${col + 1}`;
      deck.seats.left.push({
        id: `lower-left-${seatNumber}`,
        number: seatNumber,
        deck: 'lower',
        type: 'regular',
        position: { row: newRow, col, side: 'left' }
      });
    }
    
    for (let col = 0; col < 2; col++) {
      const seatNumber = `${String.fromCharCode(65 + newRow)}${col + 3}`;
      deck.seats.right.push({
        id: `lower-right-${seatNumber}`,
        number: seatNumber,
        deck: 'lower',
        type: 'regular',
        position: { row: newRow, col: col + 2, side: 'right' }
      });
    }
    
    deck.rows += 1;
    setLayout(updatedLayout);
    setHasUnsavedChanges(true);
  };

  const deleteLastRow = () => {
    if (!layout) return;
    
    const updatedLayout = { ...layout };
    const deck = updatedLayout.decks[0];
    if (!deck || deck.rows <= 1) return;
    
    const lastRow = deck.rows - 1;
    
    deck.seats.left = deck.seats.left.filter(s => s.position.row !== lastRow);
    deck.seats.right = deck.seats.right.filter(s => s.position.row !== lastRow);
    
    deck.rows -= 1;
    setLayout(updatedLayout);
    setHasUnsavedChanges(true);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading seat layout...</p>
      </div>
    );
  }

  if (error && !layout) {
    return (
      <div className={styles.error}>
        <FaBus className={styles.errorIcon} />
        <h3>Unable to Load Seat Layout</h3>
        <p>{error}</p>
        <button 
          onClick={createDefaultLayout}
          className={styles.retryBtn}
        >
          Create Default Layout
        </button>
      </div>
    );
  }

  if (!layout) {
    return (
      <div className={styles.error}>
        <FaBus className={styles.errorIcon} />
        <h3>No Layout Found</h3>
        <p>This bus doesn't have a seat layout yet.</p>
        <button 
          onClick={createDefaultLayout}
          className={styles.retryBtn}
        >
          Create Default Layout
        </button>
      </div>
    );
  }

  const currentDeck = layout.decks[0];
  const leftSeats = currentDeck?.seats?.left || [];
  const rightSeats = currentDeck?.seats?.right || [];
  const maxRows = currentDeck?.rows || 0;

  const visibleLeftSeats = userView ? leftSeats.filter(s => s.type === 'regular') : leftSeats;
  const visibleRightSeats = userView ? rightSeats.filter(s => s.type === 'regular') : rightSeats;
  
  const bookedCount = userView ? Array.from(seatStatuses.values()).filter(s => s === 'booked').length : 0;
  const availableCount = userView ? Array.from(seatStatuses.values()).filter(s => s === 'available').length : 0;
  const selectedCount = selectedSeats.length;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2>{userView ? 'Select Your Seat' : 'Seat Layout Designer'}</h2>
          <p className={styles.subtitle}>
            {layout.vehicle_no} • <span style={{ color: '#10b981', fontWeight: 'bold' }}>{layout.total_seats} Available Seats</span>
            {!userView && <span style={{ color: '#94a3b8', marginLeft: '0.5rem' }}>({layout.total_capacity} Total Capacity)</span>}
          </p>
          {userView && selectedCount > 0 && (
            <p className={styles.selectedInfo}>
              {selectedCount} seat{selectedCount > 1 ? 's' : ''} selected
            </p>
          )}
          {!userView && hasUnsavedChanges && (
            <p className={styles.unsavedIndicator}>You have unsaved changes</p>
          )}
        </div>
        <div className={styles.headerActions}>
          {!readOnly && !userView && (
            <>
              {!editMode ? (
                <button 
                  className={styles.modeBtn}
                  onClick={() => setEditMode(true)}
                >
                  <FaEdit /> Edit Layout
                </button>
              ) : (
                <>
                  <button 
                    className={styles.cancelBtn}
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    <FaTimes /> Cancel
                  </button>
                  <button 
                    className={styles.saveBtn}
                    onClick={handleSave}
                    disabled={saving || !hasUnsavedChanges}
                  >
                    <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        {userView ? (
          <>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.booked}`}></div>
              <span>Booked</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.available}`}></div>
              <span>Available</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.selected}`}></div>
              <span>Selected</span>
            </div>
          </>
        ) : (
          <>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.regular}`}></div>
              <span>Regular Seat ({leftSeats.filter(s => s.type === 'regular').length + rightSeats.filter(s => s.type === 'regular').length})</span>
            </div>
            <div className={styles.legendItem}>
              <FaBan className={styles.blockedLegend} />
              <span>Blocked ({leftSeats.filter(s => s.type === 'blocked').length + rightSeats.filter(s => s.type === 'blocked').length})</span>
            </div>
            <div className={styles.legendItem}>
              <FaUser className={styles.driverLegend} />
              <span>Driver ({leftSeats.filter(s => s.type === 'driver').length + rightSeats.filter(s => s.type === 'driver').length})</span>
            </div>
            <div className={styles.legendItem}>
              <FaRestroom className={styles.wcLegend} />
              <span>WC ({leftSeats.filter(s => s.type === 'wc').length + rightSeats.filter(s => s.type === 'wc').length})</span>
            </div>
          </>
        )}
      </div>

      {/* Main Layout Area */}
      <div className={styles.layoutArea}>
        {/* Bus Frame */}
        <div className={styles.busFrame}>
          <div className={styles.busFront}>
            <div className={styles.driverArea}>
              <FaUser /> Front
            </div>
          </div>

          {/* Seat Layout with Aisle */}
          <div className={styles.seatLayout}>
            {/* Row labels */}
            <div className={styles.rowLabels}>
              {Array.from({ length: maxRows }).map((_, idx) => (
                <div key={`label-${idx}`} className={styles.rowLabel}>
                  {String.fromCharCode(65 + idx)}
                </div>
              ))}
            </div>

            {/* Left side seats */}
            <div className={styles.leftSection}>
              {Array.from({ length: maxRows }).map((_, rowIdx) => {
                const leftRowSeats = (userView ? visibleLeftSeats : leftSeats).filter(s => s.position.row === rowIdx);
                return (
                  <div key={`left-row-${rowIdx}`} className={styles.seatRow}>
                    {leftRowSeats.map((seat) => {
                      const status = userView ? seatStatuses.get(seat.number) : undefined;
                      const isClickable = userView ? (status === 'available') : editMode;
                      
                      if (userView && seat.type !== 'regular') return null;
                      
                      return (
                        <button
                          key={seat.id}
                          className={`${styles.seat} ${
                            selectedSeat?.id === seat.id ? styles.selected : ''
                          }`}
                          style={{ backgroundColor: getSeatColor(seat, status) }}
                          onClick={() => handleSeatClick(seat)}
                          disabled={!isClickable}
                        >
                          <div className={styles.seatIcon}>
                            {getSeatIcon(seat, status)}
                          </div>
                          <span className={styles.seatNumber}>{seat.number}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Aisle */}
            <div className={styles.aisle}>
              <FaLongArrowAltRight className={styles.aisleIcon} />
              <span>Aisle</span>
            </div>

            {/* Right side seats */}
            <div className={styles.rightSection}>
              {Array.from({ length: maxRows }).map((_, rowIdx) => {
                const rightRowSeats = (userView ? visibleRightSeats : rightSeats).filter(s => s.position.row === rowIdx);
                return (
                  <div key={`right-row-${rowIdx}`} className={styles.seatRow}>
                    {rightRowSeats.map((seat) => {
                      const status = userView ? seatStatuses.get(seat.number) : undefined;
                      const isClickable = userView ? (status === 'available') : editMode;
                      
                      if (userView && seat.type !== 'regular') return null;
                      
                      return (
                        <button
                          key={seat.id}
                          className={`${styles.seat} ${
                            selectedSeat?.id === seat.id ? styles.selected : ''
                          }`}
                          style={{ backgroundColor: getSeatColor(seat, status) }}
                          onClick={() => handleSeatClick(seat)}
                          disabled={!isClickable}
                        >
                          <div className={styles.seatIcon}>
                            {getSeatIcon(seat, status)}
                          </div>
                          <span className={styles.seatNumber}>{seat.number}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.busRear}>
            <div className={styles.exitArea}>Rear</div>
          </div>
        </div>

        {/* Row Management Buttons - Only in admin edit mode */}
        {!readOnly && editMode && !userView && (
          <div className={styles.rowManagement}>
            <button 
              className={styles.addRowBtn}
              onClick={addRow}
              disabled={saving}
            >
              <FaPlus /> Add Row (4 seats)
            </button>
            {maxRows > 1 && (
              <button 
                className={styles.deleteRowBtn}
                onClick={deleteLastRow}
                disabled={saving}
              >
                <FaMinusCircle /> Delete Last Row
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats Panel - Only in user view */}
      {userView && (
        <div className={styles.statsPanel}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Booked</span>
            <span className={styles.statValue} style={{ color: '#ef4444' }}>{bookedCount}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Available</span>
            <span className={styles.statValue} style={{ color: '#10b981' }}>{availableCount}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Selected</span>
            <span className={styles.statValue} style={{ color: '#3b82f6' }}>{selectedCount}</span>
          </div>
        </div>
      )}

      {/* Seat Editor Panel - Only in admin edit mode */}
      {selectedSeat && editMode && !userView && (
        <div className={styles.editorPanel}>
          <div className={styles.editorHeader}>
            <h3>Seat {selectedSeat.number}</h3>
            <button onClick={() => setSelectedSeat(null)} disabled={saving}>
              <FaTimes />
            </button>
          </div>

          <div className={styles.editorContent}>
            <label>Seat Type</label>
            <select 
              value={selectedSeat.type}
              onChange={(e) => handleTypeChange(selectedSeat, e.target.value as Seat['type'])}
              className={styles.statusSelect}
              disabled={saving}
            >
              <option value="regular">Regular Seat</option>
              <option value="blocked">Blocked Seat</option>
              <option value="driver">Driver Seat</option>
              <option value="wc">WC</option>
            </select>
            <p className={styles.helpText}>
              {selectedSeat.type === 'blocked' && 'Blocked seats are not visible to users'}
              {selectedSeat.type === 'driver' && 'Driver seat - shown with driver icon'}
              {selectedSeat.type === 'wc' && 'WC - shown with WC icon'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}