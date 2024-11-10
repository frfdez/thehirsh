'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore"
import { db } from "../firebase/firebaseConfig"
import { MoreVertical, Edit2, Trash2, Plus } from 'lucide-react'

type Employee = {
  id: string
  name: string
  position: string
  salary: number
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [newEmployee, setNewEmployee] = useState({ name: '', position: '', salary: 0 })
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true)
      try {
        const querySnapshot = await getDocs(collection(db, "employees"))
        const employeesData = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as Employee[]
        setEmployees(employeesData)
      } catch (error) {
        console.error("Error al obtener los datos de empleados: ", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  async function addEmployee() {
    if (newEmployee.name && newEmployee.position && newEmployee.salary > 0) {
      try {
        const docRef = await addDoc(collection(db, "employees"), newEmployee)
        setEmployees([...employees, { id: docRef.id, ...newEmployee }])
        setNewEmployee({ name: '', position: '', salary: 0 })
      } catch (e) {
        console.error("Error añadiendo empleado: ", e)
      }
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "employees", id))
      setEmployees(employees.filter(employee => employee.id !== id))
    } catch (error) {
      console.error("Error eliminando empleado: ", error)
    }
  }

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee)
    setMenuOpen(null)
  }

  const handleSaveEmployee = async () => {
    if (editingEmployee) {
      try {
        const employeeRef = doc(db, "employees", editingEmployee.id)
        await updateDoc(employeeRef, editingEmployee)
        setEmployees(employees.map(employee => 
          employee.id === editingEmployee.id ? editingEmployee : employee
        ))
        setEditingEmployee(null)
      } catch (error) {
        console.error("Error actualizando empleado: ", error)
      }
    }
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white flex justify-between items-center">
          Empleados
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Empleado
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-white">Agregar Nuevo Empleado</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Nombre del empleado"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
                <Input
                  placeholder="Posición"
                  value={newEmployee.position}
                  onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
                <Input
                  type="number"
                  placeholder="Salario"
                  value={newEmployee.salary || ''}
                  onChange={(e) => setNewEmployee({ ...newEmployee, salary: parseFloat(e.target.value) })}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
                <Button onClick={addEmployee} className="w-full bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white">
                  Agregar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-white">Cargando empleados...</p>
        ) : (
          <Table className="border-gray-700">
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-gray-700/50">
                <TableHead className="text-gray-300">Nombre</TableHead>
                <TableHead className="text-gray-300">Posición</TableHead>
                <TableHead className="text-gray-300">Salario</TableHead>
                <TableHead className="text-gray-300">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id} className="border-gray-700 hover:bg-gray-700/50">
                  <TableCell className="text-white">{employee.name}</TableCell>
                  <TableCell className="text-white">{employee.position}</TableCell>
                  <TableCell className="text-white">${employee.salary.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="relative">
                      <Button variant="ghost" size="icon" onClick={() => setMenuOpen(menuOpen === employee.id ? null : employee.id)}>
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </Button>
                      {menuOpen === employee.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-gray-700 border border-gray-600 rounded shadow-lg z-10">
                          <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-600" onClick={() => handleEditEmployee(employee)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Modificar
                          </Button>
                          <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-600" onClick={() => handleDelete(employee.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>                
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      {editingEmployee && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
          <Card className="bg-gray-800 border-gray-700 w-96">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">Modificar Empleado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input 
                placeholder="Nombre del empleado"
                value={editingEmployee.name}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <Input 
                placeholder="Posición"
                value={editingEmployee.position}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, position: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <Input 
                type="number" 
                placeholder="Salario"
                value={editingEmployee.salary}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, salary: parseFloat(e.target.value) })}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <div className="flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setEditingEmployee(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveEmployee} className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white">
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  )
}