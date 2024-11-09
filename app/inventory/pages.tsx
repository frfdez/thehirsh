import { ReactNode , useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";

type InventoryItem = {
  id: string;
  price: number;
  name: string;
  quantity: number;
};

export default function Inventory() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [newPrice, setNewPrice] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    const fetchInventoryItems = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "inventory"));
        const items = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as unknown as InventoryItem[];
        setInventoryItems(items);
      } catch (error) {
        console.error("Error al obtener los datos de inventario: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryItems();
  }, []);

  async function addInventoryItem(name: string, quantity: number) {
    try {
      const docRef = await addDoc(collection(db, "inventory"), {
        name,
        quantity
      });
      console.log("Documento escrito con ID: ", docRef.id);
    } catch (e) {
      console.error("Error añadiendo documento: ", e);
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "inventory", id));
      setInventoryItems(inventoryItems.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error eliminando documento: ", error);
    }
  };

  const handleEditPrice = (item: InventoryItem) => {
    setEditingItem(item);
    setNewPrice(item.price);
    setMenuOpen(null);
  };

  const handleSavePrice = async () => {
    if (editingItem && newPrice !== null) {
      try {
        const itemRef = doc(db, "inventory", editingItem.id);
        await updateDoc(itemRef, { price: newPrice });
        setInventoryItems(inventoryItems.map(item => 
          item.id === editingItem.id ? { ...item, price: newPrice } : item
        ));
        setEditingItem(null);
        setNewPrice(null);
        console.log("Precio actualizado");
      } catch (error) {
        console.error("Error actualizando precio: ", error);
      }
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Inventario</h2>
      {loading ? (
        <p>Cargando inventario...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ítem</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventoryItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>${item.price}</TableCell>
                <TableCell>
                  <div className="relative">
                    <button className="text-gray-500" onClick={() => setMenuOpen(menuOpen === item.id ? null : item.id)}>⋮</button>
                    {menuOpen === item.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg">
                        <button className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100" onClick={() => handleEditPrice(item)}>Modificar Precio</button>
                        <button className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100" onClick={() => handleDelete(item.id)}>Eliminar</button>
                      </div>
                    )}
                  </div>
                </TableCell>                
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {editingItem && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
          <div className="bg-white p-4 rounded">
            <h3 className="text-lg font-bold mb-2">Modificar Precio</h3>
            <input 
              type="number" 
              value={newPrice ?? ''} 
              onChange={(e) => setNewPrice(parseFloat(e.target.value))} 
              className="border p-2 mb-4 w-full"
            />
            <button className="bg-blue-500 text-white px-4 py-2 rounded mr-2" onClick={handleSavePrice}>Guardar</button>
            <button className="bg-gray-500 text-white px-4 py-2 rounded" onClick={() => setEditingItem(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}