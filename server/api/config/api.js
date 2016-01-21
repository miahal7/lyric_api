API = {  
    methods: {
        lyrics: {
            GET: function( context, connection ) {
                var hasQuery = API.utility.hasData( connection.data );
                var host = "http://api.lyricfind.com/lyric.do";
                var query = "?apikey=0a2c4c796ff987ff4a012aa754f789a2&territory=US&reqtype=default&useragent=web&output=json&trackid=";
                var trackQuery = "artistname:" + connection.data.artist + ",trackname:" + connection.data.track;
                var url = host + query + trackQuery; 

                HTTP.post(url, 
                    function (error, result) {
                        API.utility.response( context, 200, result );
                    }
                );             
            },
            POST: function( context, connection ) {
                apiKey = APIKeys.findOne({ 'owner': connection.owner }).key;

                API.utility.response( context, 200, "The new api key for " + connection.owner + " is " + apiKey );
            },
            PUT: function( context, connection ) {},
            DELETE: function( context, connection ) {}
        }
    },
    connection: function( request ) {
        var getRequestContents = API.utility.getRequestContents( request ),
            apiKey             = getRequestContents.api_key,
            pw                 = getRequestContents.pw,
            owner              = getRequestContents.owner,
            method             = request.method,
            validUser          = API.authentication( apiKey, pw, method, owner );

        if ( validUser ) {
            validUser = owner || validUser;
            delete getRequestContents.api_key;
            delete getRequestContents.pw;
            delete getRequestContents.owner;

            return { owner: validUser, data: getRequestContents };
        } else {
            return { error: 401, message: "Invalid API key." };
        }
    },
    utility: {
        response: function( context, statusCode, data ) {
            context.response.setHeader( 'Content-Type', 'application/json' );
            context.response.statusCode = statusCode;
            context.response.end( JSON.stringify( data ) );
        },
        getRequestContents: function( request ) {
            switch( request.method ) {
                case "GET":
                case "POST":
                    return request.query;
                case "PUT":
                case "DELETE":
                    return request.body;
            }
        },
        hasData: function( data ) {
            return Object.keys( data ).length > 0 ? true : false;
        }
    },
    handleRequest: function( context, resource, method ) {
        var connection = API.connection( context.request );
        if ( !connection.error ) {
            API.methods[ resource ][ method ]( context, connection );
        } else {
            API.utility.response( context, 401, connection );
        }
    },
    authentication: function( apiKey, pw, method, owner ) {
        var getUser = APIKeys.findOne( { "key": apiKey }, { fields: { "owner": 1 } } );
        if ( getUser ) {
            return getUser.owner;
        } else if (pw === "_1Yr!C_@p!_" && method === "POST") {
            var newApiKey = Random.hexString( 32 );

            APIKeys.remove( { owner: owner });
            APIKeys.insert({ owner: owner, key: newApiKey });

            return newApiKey;
        } else {
            return false;
        }
    }
};