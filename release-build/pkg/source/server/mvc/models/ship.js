/**
 * @file       ship.js
 * @brief      舰船模型，处理舰船信息的CRUD操作和位置跟踪（已弃用，所有代码已注释）
 * @date       2025-11-28
 * @copyright  Copyright (c) 2025
 */

// class ShipModel {
//     static async findAll() {
//         try {
//             const results = await db.select('SEARCH_SHIP');
//             return results;
//         } catch (error) {
//             throw error;
//         }
//     }

//     static async findByShipName(shipName) {

//         try {
//             const results = await db.select('SEARCH_SHIP', '*', `SHIP_NAME='${shipName}'`);
//             return results;
//         } catch (error) {
//             throw error;
//         }
//     }
//     static async findByShipCode(ship_code) {
//         const sql=`SELECT * FROM  SEARCH_SHIP S LEFT JOIN
//         ( SELECT * FROM SEARCH_LOCATION M WHERE M.ID = ( SELECT MAX(T.ID) FROM SEARCH_LOCATION T  WHERE T.SHIP_CODE='${ship_code}' GROUP BY T.ID)
//         ) L ON S.SHIP_CODE=L.SHIP_CODE 
//         WHERE S.SHIP_CODE = '${ship_code}'`
//         try {
//             // const results = await db.select('SEARCH_SHIP', '*', `SHIP_CODE=${ship_code}`);
//             const results = await db.selectBySql(sql);
//             return results;
//         } catch (error) {
//             throw error;
//         }
//     }


//     static async create(ship) {

//         try {
//             const results = await db.insert('SEARCH_SHIP', ship);
//             return results;
//         } catch (error) {
//             throw error;
//         }
//     }
    
//     static async updateStatus(ship_code, isOnline) {
//         try {
//             let ship = {
//                 isonline: isOnline
//             };
//             const results = await db.update('SEARCH_SHIP', ship, `SHIP_CODE=${ship_code}`);
//             return results;
//         } catch (error) {
//             throw error;
//         }
//     }

//     static async update(ship_code, ship) {

//         try {
//             const results = await db.update('SEARCH_SHIP', ship, `SHIP_CODE=${ship_code}`);
//             return results;
//         } catch (error) {
//             throw error;
//         }
//     }

//     static async delete(ship_code) {

//         try {
//             const results = await db.remove('SEARCH_SHIP', `SHIP_CODE=${ship_code}`);
//             return results;
//         } catch (error) {
//             throw error;
//         }
//     }
// }

// module.exports = ShipModel;