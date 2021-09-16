const axios = require('axios')
require('dotenv').config({path:'variables.env'});

exports.dateasAxios = axios.create({
    baseURL : process.env.DATEAS,
    delayed: true
})

exports.cuitonlineAxios = axios.create({
    baseURL : process.env.CUITONLINE,
    delayed: true
})

exports.getOrderMatchListByMerchantAxios = axios.create({
    baseURL : process.env.GETORDERMATCHLISTBYMERCHANT
})
