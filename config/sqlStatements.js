exports.sqlGenerator = function(search, res, next){ 
    let statement="";
    let aux="";

    for (var key in search) { 
        
                if (key=="OR"){
                    statement+=" OR (" + this.sqlGenerator(search[key])+")";

                }
                
                else if(key=="ORDER BY"){

                    statement+=" ORDER BY ";

                    for(let column in search[key]){
                        statement+=column+" "+search[key][column];
                    }
                    
                }
                else{

                    for (var condicion in search[key]){
            
                        if(search[key][condicion]!=='' && search[key][condicion]!==null){
            
                            statement+=aux+" "+key;
            
                            if (condicion == "is")
                                statement += "=" + search[key][condicion];
                            if (condicion == "is not")
                                statement += "!=" + search[key][condicion];
                            if (condicion == "contains")
                                statement += " LIKE '%" + search[key][condicion] + "%'";
                            if (condicion == "is date")
                                statement += "=" + "'"+search[key][condicion]+"'";
                            if (condicion == "before date")
                                statement += "<=" + "'"+search[key][condicion]+"'";
                            if (condicion == "after date")
                                statement += ">=" + "'"+search[key][condicion]+"'";
            
                                aux = " AND";
            
                        } 
                    }
                }
                
            }
            return statement;
}

exports.sqlDateFilterGenerator = function(search, res, next){
    
    let statement = "";
    let aux = "";
    for (var key in search) {
        console.log("//:"+key);
        if (key == "event.date") {
            for (var condition in search[key]) {
                if (condition == "month") {
                    statement += aux + " MONTH(" + key + ")=" + search[key][condition];
                    aux = " AND";
                } else if (condition == "year") {
                    statement += aux + " YEAR(" + key + ")=" + search[key][condition];
                    aux = " AND";
                }
                else if (condition == "between") {
                    statement += aux  +" "+ key+ " BETWEEN " + search[key][condition];
                    aux = " AND";
                }
            }
        }
        else {

            for (var condition in search[key]) {

                if (search[key][condition] !== '' && search[key][condition] !== null) {

                    statement += aux + " " + key;

                    if (condition == "is")
                        statement += "=" + search[key][condition];
                    if (condition == "is not")
                        statement += "!=" + search[key][condition];
                    if (condition == "contains")
                        statement += " LIKE '%" + search[key][condition] + "%'";
                    if (condition == "is date")
                        statement += "=" + "'" + search[key][condition] + "'";
                    if (condition == "before date")
                        statement += "<=" + "'" + search[key][condition] + "'";
                    if (condition == "after date")
                        statement += ">=" + "'" + search[key][condition] + "'";

                        aux = " AND";

                }
            }
        }
    }

    if (statement != "") {
        return " AND " + statement;
    } else {
        return "1";
    }

}
 