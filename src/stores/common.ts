import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    notification: {
        isNotified: false,
        type: "",
        message: "",
    },
}

export const commonSlice = createSlice({
    name: 'common',
    initialState,
    reducers: {
        setNotification: (state, action) => {
            state.notification = action.payload
        },
    },
})

export const {
    setNotification
} = commonSlice.actions

export default commonSlice.reducer