import type { Vehicle } from '../api/types'
import {
  changedFields,
  EMPTY_VEHICLE_FORM,
  formValuesFrom,
  restockError,
  toCreatePayload,
  vehicleFormErrors,
  type VehicleFormValues,
} from './vehicleForm'

const valid: VehicleFormValues = {
  make: 'Hyundai',
  model: 'Creta',
  category: 'SUV',
  price: '1399000',
  quantity: '3',
}

const creta: Vehicle = {
  id: 2,
  make: 'Hyundai',
  model: 'Creta',
  category: 'SUV',
  price: 1399000,
  quantity: 2,
}

test('a complete form has no errors', () => {
  expect(vehicleFormErrors(valid)).toEqual({})
})

test('an empty form reports every field', () => {
  expect(vehicleFormErrors(EMPTY_VEHICLE_FORM)).toEqual({
    make: 'Enter a make.',
    model: 'Enter a model.',
    category: 'Choose a category.',
    price: 'Enter a whole-rupee price of at least ₹1.',
    quantity: 'Enter the number in stock.',
  })
})

test.each([
  ['make', '   ', 'Enter a make.'],
  ['model', '   ', 'Enter a model.'],
  ['price', '0', 'Enter a whole-rupee price of at least ₹1.'],
  ['price', '-5', 'Enter a whole-rupee price of at least ₹1.'],
  ['price', '1.5', 'Enter a whole-rupee price of at least ₹1.'],
  ['quantity', '-1', "Quantity can't be negative."],
  ['quantity', '2.5', 'Enter a whole number.'],
] as const)('%s %j is rejected', (field, value, message) => {
  expect(vehicleFormErrors({ ...valid, [field]: value })).toEqual({ [field]: message })
})

// The other side of each boundary.
test.each([
  ['price', '1'],
  ['quantity', '0'],
] as const)('%s %j is accepted', (field, value) => {
  expect(vehicleFormErrors({ ...valid, [field]: value })).toEqual({})
})

test('the create payload has trimmed text and numbers, not strings', () => {
  expect(toCreatePayload({ ...valid, make: '  Hyundai ' })).toEqual({
    make: 'Hyundai',
    model: 'Creta',
    category: 'SUV',
    price: 1399000,
    quantity: 3,
  })
})

test('form values from a vehicle are strings ready for the inputs', () => {
  expect(formValuesFrom(creta)).toEqual({
    make: 'Hyundai',
    model: 'Creta',
    category: 'SUV',
    price: '1399000',
    quantity: '2',
  })
})

test('an unchanged form sends nothing', () => {
  expect(changedFields(creta, formValuesFrom(creta))).toEqual({})
})

test('only the changed fields are sent, as numbers', () => {
  const edited = { ...formValuesFrom(creta), price: '1499000', quantity: '5' }

  expect(changedFields(creta, edited)).toEqual({ price: 1499000, quantity: 5 })
})

// "Hyundai " trims to the stored "Hyundai", so it isn't a change.
test('extra spaces alone are not a change', () => {
  const edited = { ...formValuesFrom(creta), make: ' Hyundai  ' }

  expect(changedFields(creta, edited)).toEqual({})
})

test.each([
  ['1', null],
  ['25', null],
  ['0', 'Enter at least 1.'],
  ['-3', 'Enter at least 1.'],
  ['2.5', 'Enter at least 1.'],
  ['', 'Enter at least 1.'],
])('restock amount %j → %j', (amount, expected) => {
  expect(restockError(amount)).toBe(expected)
})
