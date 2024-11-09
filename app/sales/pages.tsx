import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";

const topSellingItems = [
  { name: 'Hamburguesa', quantity: 100 },
  { name: 'Pizza', quantity: 80 },
  { name: 'Refresco', quantity: 150 },
];

export default function Sales() {
  const [orders, setOrders] = useState<{ item: string, quantity: number, cost: number, id?: string }[]>([]);
  const [newOrder, setNewOrder] = useState({ item: '', quantity: 0, cost: 0 });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        const ordersData = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as unknown as { item: string, quantity: number, cost: number, id?: string }[];
        setOrders(ordersData);
      } catch (error) {
        console.error("Error al obtener los datos de órdenes: ", error);
      }
    };

    fetchOrders();
  }, []);

  const handleAddOrder = async () => {
    console.log("Intentando añadir un pedido..."); // Verificación de ejecución
    if (newOrder.item && newOrder.quantity > 0 && newOrder.cost > 0) {
      try {
        // Añadir a la colección "orders"
        const orderRef = await addDoc(collection(db, "orders"), newOrder);
        console.log("Pedido añadido a 'orders' con ID: ", orderRef.id);
  
        // Añadir a la colección "inventory" con los campos correspondientes
        const inventoryItem = {
          name: newOrder.item,
          price: newOrder.cost,
          quantity: newOrder.quantity,
        };
        const inventoryRef = await addDoc(collection(db, "inventory"), inventoryItem);
        console.log("Pedido añadido a 'inventory' con ID: ", inventoryRef.id);
  
        // Actualizar el estado para reflejar el nuevo pedido en "orders"
        setOrders([...orders, { ...newOrder, id: orderRef.id }]);
        setNewOrder({ item: '', quantity: 0, cost: 0 });
        
        alert("Pedido añadido exitosamente a Firestore en ambas colecciones!");
      } catch (error) {
        console.error("Error añadiendo pedido: ", error);
        alert("No se pudo añadir el pedido. Verifica las reglas de Firestore o la conexión.");
      }
    } else {
      alert("Todos los campos son obligatorios y deben tener valores válidos.");
    }
  };

  const totalSpent = orders.reduce((sum, order) => sum + (order.cost * order.quantity), 0);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Ventas y Restock</h2>
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Más Vendidos</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ítem</TableHead>
              <TableHead>Cantidad Vendida</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topSellingItems.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">Pedidos al Proveedor</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ítem</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Costo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order, index) => (
              <TableRow key={index}>
                <TableCell>{order.item}</TableCell>
                <TableCell>{order.quantity}</TableCell>
                <TableCell>${order.cost}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="mt-2">Total gastado este mes: ${totalSpent}</p>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="mt-4">Nuevo Pedido</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Pedido al Proveedor</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <Input
                placeholder="Ítem"
                value={newOrder.item}
                onChange={(e) => setNewOrder({ ...newOrder, item: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Cantidad"
                value={newOrder.quantity || ''}
                onChange={(e) => setNewOrder({ ...newOrder, quantity: parseInt(e.target.value) })}
              />
              <Input
                type="number"
                placeholder="Costo"
                value={newOrder.cost || ''}
                onChange={(e) => {
                  const value = parseFloat(e.target.value)
                  if (value >= 0) {
                    setNewOrder({ ...newOrder, cost: value })
                  } else {
                    setNewOrder({ ...newOrder, cost: 0 })
                  }
                }}
              />
              <Button onClick={handleAddOrder}>Agregar Pedido</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}