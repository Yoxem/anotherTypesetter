use rsexp;
use crate::rsexp::Error;
use rsexp::Sexp;
use printpdf::*;
use std::fs::File;
use std::io::BufWriter;

// storing measuring unit.
enum Measure{
    Pt(f64),
    Px(f64)
}

enum Expr{
    Mea(Measure), // wrapper for measure
    Str(String),
    Style{font_path : Measure, size : Measure},
    Func(String, Vec<Expr>),
    Void // return nothing
}

const PDF_title :&str = "test title";
const defaultLayer : &str = "Default Layer"; // Layer name for PDF

fn interp(exp : Expr)->Expr{
    let (mut pdf_doc, mut page_index, mut layer_index) = PdfDocument::new(PDF_title,
        Mm(210.0), Mm(297.0), defaultLayer);
    return match exp {
        // convert pt to px
        Expr::Mea(Measure::Pt(x)) =>  interp(Expr::Mea(Measure::Px(x * 4.0/3.0))), // convert pt to px. 1pt = 4/3px
        Expr::Mea(Measure::Px(x)) =>  exp, // return it's original value
    
        // Functions
        // (createPDF '())
        Expr::Func(x, y) => match x.as_str()
                                // PdfDocument::new(document title, x, y, layerName)
                                {"createPDF" => {(pdf_doc, page_index, layer_index) = PdfDocument::new(PDF_title,
                                                Mm(247.0), Mm(210.0), defaultLayer);
                                                return Expr::Void;},
                                // writePDF => write to a file
                                "writePDF" => match &y[..] {
                                    [Expr::Str(x)] => {
                                        pdf_doc.save(&mut BufWriter::new(File::create(x.as_str()).unwrap())).unwrap();
                                        return Expr::Void;},
                                    _ => {panic!("argument not well-formed"); Expr::Void}
                                }
                                // "addPage" => 
                                _ => Expr::Void, }

        _ => {panic!("function not found");  Expr::Void},
    };
}

fn main() {
    interp(Expr::Mea(Measure::Pt(2.2)));
}
