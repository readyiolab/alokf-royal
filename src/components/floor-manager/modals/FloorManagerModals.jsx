import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const AddTableModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    table_number: '',
    table_name: '',
    game_type: 'Texas Hold\'em',
    stakes: '',
    max_seats: '6',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      table_number: '',
      table_name: '',
      game_type: 'Texas Hold\'em',
      stakes: '',
      max_seats: '6',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Table</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Table Number</Label>
            <Input
              type="number"
              placeholder="1"
              value={formData.table_number}
              onChange={(e) =>
                setFormData({ ...formData, table_number: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label>Table Name</Label>
            <Input
              placeholder="High Stakes"
              value={formData.table_name}
              onChange={(e) =>
                setFormData({ ...formData, table_name: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label>Game Type</Label>
            <Select
              value={formData.game_type}
              onValueChange={(value) =>
                setFormData({ ...formData, game_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Texas Hold'em">Texas Hold'em</SelectItem>
                <SelectItem value="Omaha">Omaha</SelectItem>
                <SelectItem value="7-Card Stud">7-Card Stud</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Stakes</Label>
            <Input
              placeholder="100/200"
              value={formData.stakes}
              onChange={(e) =>
                setFormData({ ...formData, stakes: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label>Max Seats</Label>
            <Input
              type="number"
              value={formData.max_seats}
              onChange={(e) =>
                setFormData({ ...formData, max_seats: e.target.value })
              }
              required
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create Table</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const AddPlayerModal = ({ isOpen, onClose, table, onSubmit }) => {
  const [formData, setFormData] = useState({
    player_id: '',
    seat_number: '',
    buy_in_amount: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ player_id: '', seat_number: '', buy_in_amount: '' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Player to Table {table?.table_number}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Player</Label>
            <Input
              placeholder="Search player..."
              value={formData.player_id}
              onChange={(e) =>
                setFormData({ ...formData, player_id: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label>Seat Number</Label>
            <Input
              type="number"
              placeholder="1-6"
              value={formData.seat_number}
              onChange={(e) =>
                setFormData({ ...formData, seat_number: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label>Buy-in Amount (₹)</Label>
            <Input
              type="number"
              placeholder="5000"
              value={formData.buy_in_amount}
              onChange={(e) =>
                setFormData({ ...formData, buy_in_amount: e.target.value })
              }
              required
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Player</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const AssignDealerModal = ({ isOpen, onClose, table, dealers, onSubmit }) => {
  const [selectedDealer, setSelectedDealer] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(selectedDealer);
    setSelectedDealer('');
  };

  const availableDealers = dealers.filter(d => d.dealer_status === 'available');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Dealer to Table {table?.table_number}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Select Dealer</Label>
            <Select value={selectedDealer} onValueChange={setSelectedDealer}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a dealer..." />
              </SelectTrigger>
              <SelectContent>
                {availableDealers.map(dealer => (
                  <SelectItem key={dealer.dealer_id} value={dealer.dealer_id.toString()}>
                    {dealer.dealer_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedDealer}>
              Assign Dealer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
