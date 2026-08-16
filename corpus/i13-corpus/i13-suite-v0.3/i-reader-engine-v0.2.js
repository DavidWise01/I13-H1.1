const IReader = (() => {
  const VERSION = "i-reader-v0.2";
  const PROTOCOL = "i13-ingress/0.2";
  const KEYWORDS = new Set(["def","I","if","else"]);
  const TWO = new Set(["<-","->","<=",">=","==","!="]);
  const ONE = new Set(["+","-","*","/","<",">","(",")","{","}",",","."]);

  class ReadError extends Error {
    constructor(message, line, col, offset) {
      super(message);
      this.name = "ReadError";
      this.line = line;
      this.col = col;
      this.offset = offset;
    }
  }

  class ParseError extends Error {
    constructor(message, token) {
      super(message + (token ? ` at ${token.line}:${token.col}` : ""));
      this.name = "ParseError";
      this.token = token || null;
    }
  }

  function utf8OffsetMap(source) {
    const map = new Array(source.length + 1);
    let bytes = 0;
    map[0] = 0;
    for (let i=0;i<source.length;i++) {
      const cp = source.codePointAt(i);
      let n;
      if (cp <= 0x7f) n=1;
      else if (cp <= 0x7ff) n=2;
      else if (cp <= 0xffff) n=3;
      else n=4;
      bytes += n;
      map[i+1] = bytes;
      if (cp > 0xffff) {
        i++;
        map[i+1] = bytes;
      }
    }
    return map;
  }

  function lex(source) {
    const tokens = [];
    const byteMap = utf8OffsetMap(source);
    let i = 0, line = 1, col = 1;
    const n = source.length;

    const adv = () => {
      const c = source[i++];
      if (c === "\n") { line++; col = 1; } else col++;
      return c;
    };

    const add = (kind, lexeme, start, end, sl, sc) => {
      const idx = tokens.length;
      tokens.push({
        index:idx, kind, lexeme,
        start, end,
        byte_start:byteMap[start],
        byte_end:byteMap[end],
        line:sl, col:sc,
        end_line:sl,
        end_col:sc + lexeme.length
      });
    };

    while (i < n) {
      const c = source[i];

      if (c === " " || c === "\t" || c === "\r" || c === "\n") {
        adv(); continue;
      }

      if (c === "/" && source[i+1] === "/") {
        while (i < n && source[i] !== "\n") adv();
        continue;
      }

      const start = i, sl = line, sc = col;
      const two = source.slice(i, i+2);

      if (TWO.has(two)) {
        adv(); adv();
        add(two === "<-" ? "BIND" : two === "->" ? "RETURN" : "OP",
            two, start, i, sl, sc);
        continue;
      }

      if (/[A-Za-z_]/.test(c)) {
        let s = "";
        while (i < n && /[A-Za-z0-9_]/.test(source[i])) s += adv();
        add(KEYWORDS.has(s) ? "KW" : "IDENT", s, start, i, sl, sc);
        continue;
      }

      if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(source[i+1] || ""))) {
        let s = "", dots = 0;
        while (i < n) {
          const q = source[i];
          if (/[0-9]/.test(q)) { s += adv(); continue; }
          if (q === "." && dots === 0) { dots++; s += adv(); continue; }
          break;
        }
        if (s === "." || Number.isNaN(Number(s)))
          throw new ReadError("invalid numeric constant", sl, sc, start);
        add("NUMBER", s, start, i, sl, sc);
        continue;
      }

      if (ONE.has(c)) {
        adv(); add("PUNCT", c, start, i, sl, sc); continue;
      }

      throw new ReadError(`illegal character ${JSON.stringify(c)}`, sl, sc, start);
    }

    tokens.push({
      index:tokens.length, kind:"EOF", lexeme:"",
      start:n,end:n,byte_start:byteMap[n],byte_end:byteMap[n],
      line,col,end_line:line,end_col:col
    });
    return tokens;
  }

  class Parser {
    constructor(tokens, source) {
      this.t=tokens; this.source=source; this.i=0; this.nextNodeId=0;
    }
    cur(){ return this.t[this.i]; }
    at(x){ return this.cur().lexeme===x; }
    eof(){ return this.cur().kind==="EOF"; }
    take(){ return this.t[this.i++]; }
    expectLex(x){
      if(!this.at(x)) throw new ParseError(`expected ${JSON.stringify(x)}, got ${JSON.stringify(this.cur().lexeme)}`,this.cur());
      return this.take();
    }
    expectKind(k){
      if(this.cur().kind!==k) throw new ParseError(`expected ${k}, got ${this.cur().kind}`,this.cur());
      return this.take();
    }

    loc(startToken, endTokenExclusive, forceProgram=false) {
      const real = this.t.filter(t=>t.kind!=="EOF");
      if (forceProgram) {
        const first = real[0] || this.t[0];
        const eof = this.t[this.t.length-1];
        return {
          token_start: real.length ? 0 : null,
          token_end: real.length ? real.length : null,
          char_start:0, char_end:this.source.length,
          byte_start:0, byte_end:eof.byte_end,
          line_start:1, col_start:1,
          line_end:eof.line, col_end:eof.col,
          source:this.source
        };
      }

      if (startToken == null || endTokenExclusive == null || endTokenExclusive <= startToken) {
        const t=this.t[startToken ?? this.i] || this.t[this.t.length-1];
        return {
          token_start:startToken ?? null, token_end:endTokenExclusive ?? null,
          char_start:t.start, char_end:t.start,
          byte_start:t.byte_start, byte_end:t.byte_start,
          line_start:t.line,col_start:t.col,line_end:t.line,col_end:t.col,
          source:""
        };
      }

      const a=this.t[startToken], b=this.t[endTokenExclusive-1];
      return {
        token_start:startToken,
        token_end:endTokenExclusive,
        char_start:a.start,
        char_end:b.end,
        byte_start:a.byte_start,
        byte_end:b.byte_end,
        line_start:a.line,
        col_start:a.col,
        line_end:b.end_line,
        col_end:b.end_col,
        source:this.source.slice(a.start,b.end)
      };
    }

    node(type,start,end,fields={}) {
      return Object.assign({
        type,
        node_id:this.nextNodeId++,
        loc:this.loc(start,end)
      }, fields);
    }

    parseProgram(stopOnBrace=false, programStart=0) {
      const body=[];
      const start=this.i;
      while(!this.eof() && !(stopOnBrace && this.at("}"))) body.push(this.parseStmt());
      if(stopOnBrace) return {type:"ProgramFragment",body,start,end:this.i};
      return Object.assign({
        type:"Program",
        node_id:this.nextNodeId++,
        loc:this.loc(programStart,this.i,true)
      },{body});
    }

    parseStmt(){
      if(this.at("def")) return this.parseDef();
      if(this.at("I")) return this.parseDecl();
      if(this.at("if")) return this.parseIf();
      if(this.at("->")) return this.parseReturn();

      if(this.cur().kind==="IDENT"){
        const save=this.i;
        const target=this.parseTarget();
        if(this.at("<-")){
          const start=target.loc.token_start;
          this.take();
          const value=this.parseExpr();
          return this.node("Assign",start,this.i,{target,value,osmotic:target.attr==="p"});
        }
        this.i=save;
      }

      const start=this.i;
      const value=this.parseExpr();
      return this.node("Expr",start,this.i,{value});
    }

    parseBlock(){
      const start=this.i;
      this.expectLex("{");
      const p=this.parseProgram(true,this.i);
      if(!this.at("}")) throw new ParseError("unclosed block",this.cur());
      this.take();
      return this.node("Block",start,this.i,{body:p.body});
    }

    parseDef(){
      const start=this.i;
      this.expectLex("def");
      const name=this.expectKind("IDENT").lexeme;
      this.expectLex("(");
      const params=[];
      if(!this.at(")")){
        while(true){
          this.expectLex("I");
          params.push(this.expectKind("IDENT").lexeme);
          if(this.at(",")){this.take();continue;}
          break;
        }
      }
      this.expectLex(")");
      const body=this.parseBlock();
      return this.node("FunctionDef",start,this.i,{name,params,body});
    }

    parseDecl(){
      const start=this.i;
      this.expectLex("I");
      const name=this.expectKind("IDENT").lexeme;
      this.expectLex("<-");
      const value=this.parseExpr();
      return this.node("Declare",start,this.i,{name,value});
    }

    parseIf(){
      const start=this.i;
      this.expectLex("if");
      const test=this.parseExpr();
      const then=this.parseBlock();
      let otherwise=null;
      if(this.at("else")){this.take(); otherwise=this.parseBlock();}
      return this.node("If",start,this.i,{test,then,otherwise});
    }

    parseReturn(){
      const start=this.i;
      this.expectLex("->");
      const value=this.parseExpr();
      return this.node("Return",start,this.i,{value});
    }

    parseTarget(){
      const start=this.i;
      const name=this.expectKind("IDENT").lexeme;
      let attr=null;
      if(this.at(".")){this.take();attr=this.expectKind("IDENT").lexeme;}
      return this.node("Target",start,this.i,{name,attr});
    }

    parseExpr(){ return this.parseCompare(); }

    parseCompare(){
      let left=this.parseAdd();
      while(["<",">","<=",">=","==","!="].includes(this.cur().lexeme)){
        const start=left.loc.token_start;
        const op=this.take().lexeme;
        const right=this.parseAdd();
        left=this.node("Compare",start,this.i,{op,left,right});
      }
      return left;
    }

    parseAdd(){
      let left=this.parseMul();
      while(this.at("+")||this.at("-")){
        const start=left.loc.token_start;
        const op=this.take().lexeme;
        const right=this.parseMul();
        left=this.node("BinOp",start,this.i,{op,left,right});
      }
      return left;
    }

    parseMul(){
      let left=this.parseUnary();
      while(this.at("*")||this.at("/")){
        const start=left.loc.token_start;
        const op=this.take().lexeme;
        const right=this.parseUnary();
        left=this.node("BinOp",start,this.i,{op,left,right});
      }
      return left;
    }

    parseUnary(){
      if(this.at("-")){
        const start=this.i;
        const op=this.take().lexeme;
        const value=this.parseUnary();
        return this.node("Unary",start,this.i,{op,value});
      }
      return this.parsePrimary();
    }

    parsePrimary(){
      let node;
      if(this.cur().kind==="NUMBER"){
        const start=this.i, t=this.take();
        node=this.node("Constant",start,this.i,{value:Number(t.lexeme),raw:t.lexeme});
      } else if(this.cur().kind==="IDENT"){
        const start=this.i, t=this.take();
        node=this.node("Name",start,this.i,{id:t.lexeme});
      } else if(this.at("(")){
        this.take();
        node=this.parseExpr();
        this.expectLex(")");
      } else {
        throw new ParseError(`expected expression, got ${JSON.stringify(this.cur().lexeme)}`,this.cur());
      }

      while(true){
        if(this.at("(")){
          const start=node.loc.token_start;
          this.take();
          const args=[];
          if(!this.at(")")){
            while(true){
              args.push(this.parseExpr());
              if(this.at(",")){this.take();continue;}
              break;
            }
          }
          this.expectLex(")");
          node=this.node("Call",start,this.i,{callee:node,args});
          continue;
        }
        if(this.at(".")){
          const start=node.loc.token_start;
          this.take();
          const attr=this.expectKind("IDENT").lexeme;
          node=this.node("Attribute",start,this.i,{object:node,attr});
          continue;
        }
        break;
      }
      return node;
    }
  }

  function parse(tokens,source){
    const p=new Parser(tokens,source);
    const ast=p.parseProgram(false,0);
    if(!p.eof()) throw new ParseError("trailing tokens",p.cur());
    return ast;
  }

  function walk(node,f,depth=0){
    if(!node||typeof node!=="object") return;
    if(node.type) f(node,depth);
    for(const [k,v] of Object.entries(node)){
      if(k==="type"||k==="loc") continue;
      if(Array.isArray(v)) v.forEach(x=>walk(x,f,depth+1));
      else if(v&&typeof v==="object") walk(v,f,depth+1);
    }
  }

  function measure(source,tokens,ast){
    const useful=tokens.filter(t=>t.kind!=="EOF");
    const ids=useful.filter(t=>t.kind==="IDENT").map(t=>t.lexeme);
    const uniq=[...new Set(ids)];
    let astNodes=0,maxAstDepth=0,declares=0,funcs=0,calls=0,compares=0,binops=0,returns=0,assigns=0;
    walk(ast,(n,d)=>{
      astNodes++; if(d>maxAstDepth)maxAstDepth=d;
      if(n.type==="Declare")declares++;
      if(n.type==="FunctionDef")funcs++;
      if(n.type==="Call")calls++;
      if(n.type==="Compare")compares++;
      if(n.type==="BinOp")binops++;
      if(n.type==="Return")returns++;
      if(n.type==="Assign")assigns++;
    });
    return {
      lexical:{
        tokens:useful.length,identifiers:ids.length,distinct_identifiers:uniq.length,
        numeric_constants:useful.filter(t=>t.kind==="NUMBER").length
      },
      structural:{
        ast_nodes:astNodes,max_ast_depth:maxAstDepth,functions:funcs,calls,compares,binops,
        returns,assignments:assigns,declarations:declares
      },
      transport:{
        chars:source.length,
        bytes:new TextEncoder().encode(source).length,
        lines:source===""?0:source.split(/\n/).length,
        comments:(source.match(/\/\/[^\n]*/g)||[]).length
      }
    };
  }

  function spanIntegrity(source,tokens){
    let last=0;
    for(const t of tokens){
      if(t.kind==="EOF") continue;
      if(t.start<last||t.end<t.start) return false;
      if(source.slice(t.start,t.end)!==t.lexeme) return false;
      const bytes=new TextEncoder().encode(source.slice(0,t.start)).length;
      const bytesEnd=new TextEncoder().encode(source.slice(0,t.end)).length;
      if(bytes!==t.byte_start||bytesEnd!==t.byte_end) return false;
      last=t.end;
    }
    return true;
  }

  function astSpanIntegrity(ast,source,tokens){
    const failures=[];
    let count=0;
    walk(ast,n=>{
      count++;
      const L=n.loc;
      if(!L){failures.push({node_id:n.node_id,type:n.type,error:"missing loc"});return;}
      if(L.char_start<0||L.char_end<L.char_start||L.char_end>source.length){
        failures.push({node_id:n.node_id,type:n.type,error:"char bounds"});return;
      }
      if(source.slice(L.char_start,L.char_end)!==L.source){
        failures.push({node_id:n.node_id,type:n.type,error:"source slice mismatch"});return;
      }
      const bs=new TextEncoder().encode(source.slice(0,L.char_start)).length;
      const be=new TextEncoder().encode(source.slice(0,L.char_end)).length;
      if(bs!==L.byte_start||be!==L.byte_end){
        failures.push({node_id:n.node_id,type:n.type,error:"byte bounds mismatch"});return;
      }
      if(n.type!=="Program"){
        if(L.token_start==null||L.token_end==null||L.token_end<=L.token_start){
          failures.push({node_id:n.node_id,type:n.type,error:"token range"});return;
        }
        const a=tokens[L.token_start],b=tokens[L.token_end-1];
        if(!a||!b||a.kind==="EOF"){
          failures.push({node_id:n.node_id,type:n.type,error:"token endpoint"});return;
        }
        if(a.start!==L.char_start||b.end!==L.char_end){
          failures.push({node_id:n.node_id,type:n.type,error:"token/char mismatch"});return;
        }
      }
    });
    return {ok:failures.length===0,count,failures};
  }

  function tokenSignature(tokens){
    return tokens.filter(t=>t.kind!=="EOF")
      .map(t=>`${t.kind}:${t.lexeme}@${t.start}:${t.end}:${t.byte_start}:${t.byte_end}`).join("|");
  }

  async function sha256(source){
    const data=new TextEncoder().encode(source);
    if(typeof crypto!=="undefined"&&crypto.subtle){
      const digest=await crypto.subtle.digest("SHA-256",data);
      return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");
    }
    if(typeof require!=="undefined"){
      return require("crypto").createHash("sha256").update(Buffer.from(data)).digest("hex");
    }
    throw new Error("SHA-256 unavailable");
  }

  async function read(source,label="untitled.i13"){
    const exact=String(source);
    const tokens=lex(exact);
    const ast=parse(tokens,exact);
    const hash=await sha256(exact);
    const rel=lex(exact);
    const tokenOK=spanIntegrity(exact,tokens);
    const astOK=astSpanIntegrity(ast,exact,tokens);

    const manifest={
      protocol:PROTOCOL,
      reader:VERSION,
      label,
      source_sha256:hash,
      source_chars:exact.length,
      source_bytes:new TextEncoder().encode(exact).length,
      exact_source_preserved:true,
      token_span_integrity:tokenOK,
      ast_span_integrity:astOK.ok,
      ast_nodes_with_spans:astOK.count,
      deterministic_relex:tokenSignature(tokens)===tokenSignature(rel),
      measurements:measure(exact,tokens,ast),
      not_covered:[
        "target-language translation",
        "call-arity validation",
        "types",
        "termination",
        "arithmetic semantics"
      ]
    };

    return {
      manifest,
      source:exact,
      tokens:tokens.filter(t=>t.kind!=="EOF"),
      ast,
      ast_span_failures:astOK.failures
    };
  }

  async function selfTest(coreSource,briefSource){
    const tests=[];
    async function test(name,fn){
      try{const detail=await fn();tests.push({name,pass:true,detail:detail??"PASS"});}
      catch(e){tests.push({name,pass:false,detail:`${e.name}: ${e.message}`});}
    }

    await test("CORE reads with complete AST spans",async()=>{
      const h=await read(coreSource,"core.i13");
      if(!h.manifest.ast_span_integrity) throw new Error(JSON.stringify(h.ast_span_failures.slice(0,3)));
      return `${h.manifest.ast_nodes_with_spans} AST nodes with spans`;
    });
    await test("brief reads with complete AST spans",async()=>{
      const h=await read(briefSource,"brief.i13");
      if(!h.manifest.ast_span_integrity) throw new Error("brief span failure");
      return `${h.manifest.ast_nodes_with_spans} AST nodes with spans`;
    });
    await test("exact source preserved",async()=>{
      const h=await read(coreSource);
      if(h.source!==coreSource) throw new Error("source mutated");
      return "unchanged";
    });
    await test("token char + UTF-8 byte spans are exact",async()=>{
      const h=await read(coreSource);
      if(!h.manifest.token_span_integrity) throw new Error("token span failure");
      return `${h.tokens.length} tokens`;
    });
    await test("AST node source slices are exact",async()=>{
      const h=await read(coreSource);
      const x=astSpanIntegrity(h.ast,h.source,h.tokens);
      if(!x.ok) throw new Error(JSON.stringify(x.failures[0]));
      return `${x.count}/${x.count}`;
    });
    await test("deterministic re-lex",async()=>{
      const a=await read(coreSource),b=await read(coreSource);
      if(tokenSignature(a.tokens)!==tokenSignature(b.tokens)) throw new Error("token signatures differ");
      return "stable";
    });
    await test("malformed block rejected",async()=>{
      let ok=false;try{await read("def f(I x) { I y <- x");}catch(e){ok=e instanceof ParseError;}
      if(!ok)throw new Error("not rejected");return "rejected";
    });
    await test("illegal character rejected",async()=>{
      let ok=false;try{await read("I x <- 1 @ 2");}catch(e){ok=e instanceof ReadError;}
      if(!ok)throw new Error("not rejected");return "rejected";
    });
    await test("SHA-256 stable",async()=>{
      const a=await sha256(coreSource),b=await sha256(coreSource);
      if(a!==b)throw new Error("hash mismatch");return a.slice(0,16)+"…";
    });

    return {reader:VERSION,protocol:PROTOCOL,pass:tests.every(t=>t.pass),passed:tests.filter(t=>t.pass).length,total:tests.length,tests};
  }

  return {
    VERSION,PROTOCOL,ReadError,ParseError,
    lex,parse,read,selfTest,spanIntegrity,astSpanIntegrity,tokenSignature,walk
  };
})();
if (typeof module !== "undefined") module.exports = IReader;
