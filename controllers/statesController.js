const State = require('../model/State');
const statesJson = require('../model/states.json');
const jsonMessage = require('../middleware/jsonMessage');


const getAllStates = async (req, res) => {
    // grab states from MongoDb
    let mongoStates = await State.find();
    if (!mongoStates) return res.status(204).json({ 'message': 'No states found.' });
    // added to ensure jsonStates is refreshed to all states after multiple queries
    let jsonStates = statesJson;
    jsonStates.map(state => {
        // if mongoDB has funfacts, add them to states funfacts.
        for (let i = 0; i < mongoStates.length; i++) {
            // check if states in db has 'funfacts'
            if (mongoStates[i].stateCode === state.code && mongoStates[i].hasOwnProperty('funfacts')) {
                state.funfacts = mongoStates[i].funfacts
            }            
        };
    });

    // check for contig query. provide only contiguous states if 'true', or AK and HI if 'false'
    jsonStates = (req.query.contig === 'true') ? jsonStates.filter(state => state.code !== 'AK' && state.code !== 'HI')
        : (req.query.contig === 'false') ? jsonStates = jsonStates.filter(state => state.code === 'AK' || state.code === 'HI')
        : jsonStates;
    res.json(jsonStates);
}



const getState = async (req, res) => {
    if (!req?.params?.state) return res.status(400).json({ 'message': 'State code required.' });
    const state = await State.findOne({ stateCode: req.params.state.toUpperCase() }).exec();
    if (!state) {
        return res.status(400).json({ "message": `No state matches code ${req.params.state}.` });
    }
    
    const jsonState = statesJson.find(s => s.code == req.params.state.toUpperCase());
    if (state.funfacts && state.funfacts.length > 0) { 
        const funfacts = state.funfacts;
        jsonState['funfacts'] = funfacts;
    }    
    res.json(jsonState);
}



const getFunfact = async (req, res) => {
    if (!req?.params?.state) return res.status(400).json({ 'message': 'State code required.' });
    const state = await State.findOne({ stateCode: req.params.state.toUpperCase() }).exec();
    if (!state) {
        return res.status(400).json({ "message": `No state matches code ${req.params.state}.` });
    }
    if (!state.funfacts || state.funfacts.length < 1) {
        return res.json({'message': 'No Fun Facts found.'});
    }
    const randomIndex = Math.floor(Math.random() * state.funfacts.length)
    res.json({
        'funfact': state.funfacts[randomIndex]
    })

}

const getCapital = async (req, res) => {
    jsonMessage(req, res, 'capital');
}

const getNickname = async (req, res) => {
    jsonMessage(req, res, 'nickname');
}

const getPopulation = async (req, res) => {
    jsonMessage(req, res, 'population');
}

const getAdmission = async (req, res) => {
    jsonMessage(req, res, 'admission');
}






const createNewFunfacts = async (req, res) => {
    if (!req?.params?.state) return res.status(400).json({ 'message': 'State code required.' });
    const state = await State.findOne({ stateCode: req.params.state.toUpperCase() }).exec();
    if (!state) {
        return res.status(400).json({ "message": `No state matches code ${req.params.state}.` });
    }

    // push the funfacts that the user supplied in the body
    // to the funfacts of the state.
    if (req.body.funfacts) {
        // CHECK TO ENSURE funfacts VALUE IS AN ARRAY
        if (Array.isArray(req.body.funfacts)) {
            state.funfacts.push(...req.body.funfacts);
        } else {
            return res.status(400).json({'message': 'funfacts value must be an array.' });
        }
        
    } else {
        return res.status(400).json({'message': `body of the request must have a funfacts property.`});
    }
    // save to the DB and store in result
    const result = await state.save();

    res.json(result);

}


const updateFunfact = async (req, res) => {
    if (!req?.params?.state) return res.status(400).json({ 'message': 'State code required.' });
    const state = await State.findOne({ stateCode: req.params.state.toUpperCase() }).exec();
    if (!state) {
        return res.status(400).json({ "message": `No state matches code ${req.params.state}.` });
    }

    // Ensure 'funfact' and 'index' property
    if (req.body.funfact && req.body.index) {
        if (req.body.index < 1) {
            return res.status(400).json({'message': 'Index must be greater than zero.'});
        } else if (req.body.index > state.funfacts.length) {
            return res.status(400).json({'message': `Index value must be less than or equal to ${state.funfacts.length}`})
        } else {
            // account for zero indexing
            const correctedIndex = req.body.index - 1;
            state.funfacts[correctedIndex] = req.body.funfact; // update the funfact at provided index
        }
    } else {
        return res.status(400).json({ "message": `Body of the request must have a funfact and an index property.`});
    }

    // save to the DB and store in result
    const result = await state.save();
    res.json(result);
}


const deleteFunfact = async (req, res) => {
    if (!req?.params?.state) return res.status(400).json({ 'message': 'State code required.' });
    const state = await State.findOne({ stateCode: req.params.state.toUpperCase() }).exec();
    if (!state) {
        return res.status(400).json({ "message": `No state matches code ${req.params.state}.` });
    }

    if(!req.body.index) {
        return res.status(400).json({ 'message': 'Body of the request must have an index property.' });
    }

    if (req.body.index < 1 || req.body.index > state.funfacts.length) {
        return res.status(400).json({'message': `Index must be greater than 0 and less than ${state.funfacts.length + 1}`});
    }

    const correctedIndex = req.body.index - 1;
    state.funfacts.splice(correctedIndex, 1);
    const result = await state.save();
    res.json(result);
}





module.exports = { 
    getAllStates,
    getState,
    getCapital,
    getNickname,
    getPopulation,
    getAdmission,
    getFunfact,

    createNewFunfacts,
    updateFunfact,
    deleteFunfact
};