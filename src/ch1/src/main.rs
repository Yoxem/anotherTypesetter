// import all the parser unit for string
use nom::character::{complete::*, is_alphanumeric, is_alphabetic};

#[macro_use]
extern crate nom;

// for the return type
use nom::IResult;
// collect all the parser matched strings,
use nom::combinator::recognize;
// given 2 parser and gets the result as (1stmatched, 2ndmatched),
use nom::sequence::pair;
// exact matching characters
use nom::bytes::complete::tag;
// match a parser 0+ times
use nom::multi::fold_many0;

// integer ::= [0-9]+
pub fn integer(input: &str) -> IResult<&str, &str> {
    return digit1(input) ; // [0-9]+
}

// float ::= [0-9]+ "." [0-9]+
pub fn float(input: &str) -> IResult<&str, &str>{
    // [0-9]+ "." [0-9]+
    // "12.345" returns Ok((else, (("12", '.'), "345"))), then recgonize them as
    // Ok("12.345")
    let a = 
        recognize(pair(pair(digit1, tag(".")), digit1))(input);
    return a;

}

// ("_" | [a-z] |  [A-Z])  ("_" | [0-9] | [a-z] |  [A-Z])+
pub fn identifier(input : &str) -> IResult<&str, &str>{
    return recognize(pair(
        // 1st character is a-z, A-Z or _
        satisfy(|c| (is_alphabetic(c as u8) || c == '_')),
        // the tail characters (0+ times matched) storing in a vector
    fold_many0(
        // a-z, A-Z, 0-9, _ 
        satisfy(|c| (is_alphanumeric(c as u8) || c == '_')),
        // initial vector
        Vec::new,
        // once it matches, append the matched item to the vector.
        |mut acc: Vec<_>, item| {
          acc.push(item);
          acc
        }
      )))(input);
    
}



// test parser
#[cfg(test)]
mod tests {
    // import the functions ouside mod tests
    use super::*;


    // test integer
    #[test]
    fn test_integer() {
    //if no error is shown, the function passes the test
        assert_eq!(integer("12345"), Ok(("", "12345")));
        assert_eq!(integer("0"), Ok(("", "0")));
    }

    #[test]
    fn test_float() {
        assert_eq!(float("12.345"), Ok(("", "12.345")));
        }

        #[test]
    fn test_identifier() {
        assert_eq!(identifier("_"), Ok(("", "_")));
        }
}
