import Database from 'better-sqlite3'
import assignPrefixed from '../shared/assign-prefixed.js'
import { dirname, resolve, isAbsolute} from 'path';
import { existsSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url))
const __pkgroot = resolve(__dirname, '../..')

export default class WeatherBoardSqlite {
    
    _cwd = __pkgroot
    _databasePath = 'data/weather-board.db'
    _db

    constructor(config) {
        assignPrefixed(this, config)
        this._initialize()
        this._prepareDatabaseStatements()
    }

    _initialize() {
        let dbPath
        if(isAbsolute(this._databasePath)) {
            dbPath = this._databasePath
        } else {
            dbPath = resolve(this._cwd, this._databasePath)
        }

        let dbDir = dirname(dbPath)
        if (!existsSync(dbDir)){
            mkdirSync(dbDir, { recursive: true });
        }

        console.log(`Initialize SQLite Database at ${dbPath}`)
        this._db = new Database(dbPath, {})
        const checkTable = this._db.prepare(`SELECT name FROM sqlite_schema WHERE type='table' AND name=?;`)
        if (!checkTable.get('grid')) {
            console.log(`Creating grid table`)
            const createGridTable = this._db.prepare(`CREATE TABLE IF NOT EXISTS grid('qx' INTEGER NOT NULL, 'qy' INTEGER NOT NULL, 'x' INTEGER NOT NULL, 'y' INTEGER NOT NULL, 'char' TEXT NOT NULL, 'modified' INTEGER NOT NULL);`);
            createGridTable.run()
            const createGridCellIndex =  this._db.prepare(`CREATE UNIQUE INDEX grid_cell ON grid(x,y);`)
            const createGridQuadrantIndex =  this._db.prepare(`CREATE INDEX grid_quadrant ON grid(qx,qy);`)
            const createGridModifiedIndex =  this._db.prepare(`CREATE INDEX grid_modified ON grid(modified);`);
            createGridCellIndex.run()
            createGridQuadrantIndex.run()
            createGridModifiedIndex.run()
        }
        if (!checkTable.get('user')) {
            console.log(`Creating user table`)
            const createUserTable = this._db.prepare(`CREATE TABLE IF NOT EXISTS user('qx' INTEGER NOT NULL, 'qy' INTEGER NOT NULL, 'cx' INTEGER NOT NULL, 'cy' INTEGER NOT NULL, 'rx' INTEGER NOT NULL, 'ry' INTEGER NOT NULL, 'vx' INTEGER NOT NULL, 'vy' INTEGER NOT NULL, 'ax' INTEGER NOT NULL, 'ay' INTEGER NOT NULL, 'fontsize' INTEGER NOT NULL, 'blink' INTEGER NOT NULL, 'id' TEXT NOT NULL, 'token' TEXT NOT NULL, 'socket' TEXT, 'created' INTEGER NOT NULL, 'modified' INTEGER NOT NULL, 'moves' INTEGER NOT NULL);`)
            createUserTable.run()
            const createUserCellIndex =  this._db.prepare(`CREATE INDEX user_cx_cy_idx ON user(cx,cy);`)
            const createUserQuadrantIndex =  this._db.prepare(`CREATE INDEX user_qx_qy_idx ON user(qx,qy);`)
            const createUserIdIndex =  this._db.prepare(`CREATE UNIQUE INDEX user_id_idx ON user(id);`)
            const createUserTokenIndex =  this._db.prepare(`CREATE UNIQUE INDEX user_token_idx ON user(token);`)
            const createUserSocketIndex =  this._db.prepare(`CREATE INDEX user_socket_idx ON user(socket);`)
            const createUserModifiedIndex =  this._db.prepare(`CREATE INDEX user_modified_idx ON user(modified);`)
            const createUserMovesIndex =  this._db.prepare(`CREATE INDEX user_moves_idx ON user(moves);`)
            createUserCellIndex.run()
            createUserQuadrantIndex.run()
            createUserIdIndex.run()
            createUserTokenIndex.run()
            createUserSocketIndex.run()
            createUserModifiedIndex.run()
            createUserMovesIndex.run()
        }
        if (!checkTable.get('blacklist')) {
            console.log(`Creating blacklist table`)
            const createBlacklistTable = this._db.prepare(`CREATE TABLE IF NOT EXISTS blacklist('ip' TEXT NOT NULL, 'modified' INTEGER NOT NULL);`)
            createBlacklistTable.run()
            const createBlacklistIPIndex =  this._db.prepare(`CREATE UNIQUE INDEX blacklist_ip_idx ON blacklist(ip);`)
            createBlacklistIPIndex.run()
        }
        console.log('Database initialized')

    }

    _prepareDatabaseStatements() {
        console.log(`Prepare Database Statements`)
        // cells
        this._insertCell = this._db.prepare('INSERT INTO grid(qx, qy, x, y, char, modified) VALUES (@qx, @qy, @x, @y, @char, @modified);')
        this._insertCells = this._db.transaction((cells) => {
            for (const cell of cells) this._insertCell.run(cell)
        })
        this._updateCellByPosition = this._db.prepare(`UPDATE grid SET char = @char, modified = @modified WHERE x = @x AND y = @y;`)
        this._deleteCellByPosition = this._db.prepare(`DELETE FROM grid WHERE x = @x AND y = @y;`)
        this._deleteCellByAge = this._db.prepare(`DELETE FROM grid WHERE modified < @limit;`)
        this._selectCellByPosition = this._db.prepare(`SELECT * FROM grid WHERE x = @x AND y = @y;`)
        this._selectCellsByQuadrant = this._db.prepare(`SELECT * FROM grid WHERE qx = @qx AND qy = @qy;`)

        // users
        this._insertUser = this._db.prepare('INSERT INTO user(qx, qy, cx, cy, rx, ry, vx, vy, ax, ay, fontsize, blink, id, token, socket, created, modified, moves) VALUES (@qx, @qy, @cx, @cy, @rx, @ry, @vx, @vy, @ax, @ay, @fontsize, @blink, @id, @token, @socket, @created, @modified, @moves);')
        this._selectUsersByQuadrant = this._db.prepare(`SELECT id, qx, qy, cx, cy FROM user WHERE socket IS NOT NULL AND qx = @qx AND qy = @qy;`)
        this._selectUserByToken = this._db.prepare(`SELECT * FROM user WHERE token = @token;`)
        this._selectUserBySocket = this._db.prepare(`SELECT * FROM user WHERE socket = @socket;`)
        this._resetUserSocket = this._db.prepare(`UPDATE user SET socket = NULL WHERE socket = @socket;`)
        this._resetUserSockets = this._db.prepare(`UPDATE user SET socket = NULL WHERE socket IS NOT NULL;`)
        this._updateUserSocketByToken = this._db.prepare(`UPDATE user SET socket = @socket, modified = @modified WHERE token = @token;`)
        this._updateUserPositionBySocket = this._db.prepare(`UPDATE user SET qx = @qx, qy = @qy, cx = @cx, cy = @cy, rx = @rx, ry = @ry, modified = @modified, moves = @moves WHERE socket = @socket;`)
        this._updateUserViewPositionBySocket = this._db.prepare(`UPDATE user SET vx = @vx, vy = @vy, modified = @modified WHERE socket = @socket;`)
        this._updateUserFontsizeBySocket = this._db.prepare(`UPDATE user SET fontsize = @fontsize, modified = @modified WHERE socket = @socket;`)
        this._updateUserFeedBySocket = this._db.prepare(`UPDATE user SET ax = @ax, ay = @ay, modified = @modified WHERE socket = @socket;`)
        this._updateUserBlinkBySocket = this._db.prepare(`UPDATE user SET blink = @blink, modified = @modified WHERE socket = @socket;`)
        // blacklist
        this._selectBlacklistIP = this._db.prepare(`SELECT * FROM blacklist WHERE ip = @ip;`)
        this._deleteBlacklistIP = this._db.prepare(`DELETE FROM blacklist WHERE ip = @ip;`)
        this._updateBlacklistIP = this._db.prepare(`UPDATE blacklist SET modified = @modified WHERE ip = @ip;`)
        this._insertBlacklistIP = this._db.prepare(`INSERT INTO blacklist(ip, modified) VALUES (@ip, @modified);`)
    }

    async insertCell(qx, qy, x, y, char) {
        return this._insertCell.run({qx, qy, x, y, char, modified: Date.now()})
    }
    async insertCells(cells) {
        return this._insertCells(cells)
    }
    async updateCellByPosition(x, y, char) {
        return this._updateCellByPosition.run({x, y, char, modified: Date.now()})
    }
    async deleteCellByPosition(x, y) {
        return this._deleteCellByPosition.run({x, y})
    }
    async selectCellByPosition(x, y) {
        return this._selectCellByPosition.get({x, y})
    }
    async selectCellsByQuadrant(qx, qy) {
        return this._selectCellsByQuadrant.all({qx, qy})
    }


    async insertUser(user) {
        user.blink = (user.blink)?1:0
        return this._insertUser.run({...user, created: Date.now(), modified: Date.now()})
    }

    async selectUserByToken(token) {
        const user = this._selectUserByToken.get({token})
        if (user) user.blink = !!user.blink
        return user
    }

    async selectUsersByQuadrant(qx, qy) {
        return this._selectUsersByQuadrant.all({qx, qy})
    }

    async selectUserBySocket(socket) {
        const user = this._selectUserBySocket.get({socket})
        if (user) user.blink = !!user.blink
        return user
    }

    async resetUserSocket(socket) {
        return this._resetUserSocket.run({socket})
    }

    async resetUserSockets() {
        return this._resetUserSockets.run()
    }

    async updateUserSocketByToken(token, socket) {
        return this._updateUserSocketByToken.run({token, socket, modified: Date.now()})
    }

    async updateUserPositionBySocket(user) {
        return this._updateUserPositionBySocket.run({...user, modified: Date.now()})
    }

    async updateUserViewPositionBySocket(socket, vx, vy) {
        return this._updateUserViewPositionBySocket.run({socket, vx, vy, modified: Date.now()})
    }

    async updateUserFontsizeBySocket(socket, fontsize) {
        return this._updateUserFontsizeBySocket.run({socket, fontsize, modified: Date.now()})
    }

    async updateUserFeedBySocket(socket, ax, ay) {
        return this._updateUserFeedBySocket.run({socket, ax, ay, modified: Date.now()})
    }

    async updateUserBlinkBySocket(socket, blink) {
        blink = (blink)?1:0
        return this._updateUserBlinkBySocket.run({socket, blink, modified: Date.now()})
    }



    async selectBlacklistIP(ip) {
        return this._selectBlacklistIP.get({ip})
    }

    async deleteBlacklistIP(ip) {
        return this._deleteBlacklistIP.run({ip})
    }

    async updateBlacklistIP(ip) {
        return this._updateBlacklistIP.run({ip, modified: Date.now()})
    }

    async insertBlacklistIP(ip){
        return this._insertBlacklistIP.run({ip, modified: Date.now()})
    }

    async purge(threshold) {
        return this._deleteCellByAge.run({limit: Date.now() - threshold})
    }


}