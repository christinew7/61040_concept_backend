# Concept: Dictionary 

* **concept**: Dictionary
* **purpose**: provide a translation between two specific languages
* **principle**: the dictionary maintains a mapping of terms between two languages, <br> a user can request the translation of a term and the dictionary will provide the appriopriate term in the other language
* **state**
  * a set of `Terms` with
    * a `language1` String
    * a `language2` String
* **actions**
  * `addTerm (language1: String, language2: String)`
    * **requires** this `language1` and this `language2` as a set isn't already in the set of Terms
    * **effects** adds this `language1` and this `language2` to the set of Terms
  * `deleteTerm (language1: String, language2: String)`
    * **requires** this `language1` and this `language2` exist in the set of Terms
    * **effects** deletes this `language1` and this `language2` from the set of Terms
  * `translateTerm (language1: String): (language2: String)`
    * **requires** this `language1` exists in the set of Terms
    * **effects** returns this `language2` associated with this `language1`